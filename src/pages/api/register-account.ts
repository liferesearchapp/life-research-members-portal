import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAdministrativeRole,
  hasAllInstituteAccess,
} from "../../utils/api/authorization";
import getAccountFromRequest from "../../utils/api/get-account-from-request";
import methodAllowed from "../../utils/api/method-allowed";
import withAudit from "../../utils/api/audit";


export type RegisterAccountParams = {
  login_email: string;
  first_name: string;
  last_name: string;
  is_admin?: boolean;
  is_super_admin?: boolean;
  is_member?: boolean;
  institute_id: number[];
};
export type RegisterAccountRes = Awaited<ReturnType<typeof registerAccount>>;

function registerAccount(params: RegisterAccountParams) {
  const transaction = db.$transaction(async (prisma) => {
    const email = params.login_email.toLocaleLowerCase();

    // If the account already exists (e.g. the person is already a member of
    // another institute), we don't error out — we add them to the requested
    // institute(s) instead. This lets an admin add an existing member from
    // another institute to their own.
    const existingAccount = await prisma.account.findUnique({
      where: { login_email: email },
      include: { member: true },
    });

    // Administrative access and institute membership are independent roles.
    const needsMember = !!params.is_member;

    let account = existingAccount;
    if (!account) {
      account = await prisma.account.create({
        data: {
          login_email: email,
          is_super_admin: params.is_super_admin,
          first_name: params.first_name,
          last_name: params.last_name,
          member: needsMember
            ? { create: { work_email: email, date_joined: new Date() } }
            : undefined,
        },
        include: { member: true },
      });
    }

    let memberId = account.member?.id;
    if (!memberId && needsMember) {
      const createdMember = await prisma.member.create({
        data: {
          account_id: account.id,
          work_email: account.login_email,
          date_joined: new Date(),
        },
      });
      memberId = createdMember.id;
    }

    if (params.is_member && memberId && params.institute_id.length) {
      await Promise.all(
        params.institute_id.map((instituteId) =>
          prisma.memberInstitute.upsert({
            where: {
              memberId_instituteId: { memberId: memberId!, instituteId },
            },
            create: { memberId: memberId!, instituteId },
            update: {},
          })
        )
      );

    }

    if (params.is_admin && params.institute_id.length) {
      await Promise.all(
        params.institute_id.map((instituteId) =>
          prisma.instituteAdmin.upsert({
            where: {
              accountId_instituteId: { accountId: account!.id, instituteId },
            },
            create: { accountId: account!.id, instituteId },
            update: {},
          })
        )
      );
    }

    return account;
  });

  return transaction;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterAccountRes | string>
) {
  if (!methodAllowed(req, res, ["PUT"])) return;

  const params: RegisterAccountParams = req.body;
  const { login_email, first_name, last_name, is_admin } = params;
  if (typeof login_email !== "string")
    return res.status(400).send("Email is required.");
  if (typeof first_name !== "string")
    return res.status(400).send("First Name is required.");
  if (typeof last_name !== "string")
    return res.status(400).send("Last Name is required.");
  if (!["boolean", "undefined"].includes(typeof is_admin))
    return res.status(400).send("is_admin may only be boolean or undefined.");
  if (!["boolean", "undefined"].includes(typeof params.is_member))
    return res.status(400).send("is_member may only be boolean or undefined.");
  if (params.institute_id === undefined) {
    return res.status(400).send("Please provide at least one institute");
  }

  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;
    if (
      !assertAuthorized(
        res,
        hasAdministrativeRole(currentUser) &&
          hasAllInstituteAccess(currentUser, params.institute_id),
        "You are not authorized to register accounts."
      )
    )
      return;
    if (
      params.is_super_admin &&
      !assertAuthorized(
        res,
        currentUser.is_super_admin,
        "Only super admins may grant super admin access."
      )
    )
      return;

    const newUser = await registerAccount(params);

    return res.status(200).send(newUser);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return res
        .status(400)
        .send("This email is already registered: " + login_email);

    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}

export default withAudit(handler, { action: "register-account" });
