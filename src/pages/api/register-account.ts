import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import getAccountFromRequest from "../../utils/api/get-account-from-request";


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
    const newAccount = await prisma.account.create({
      data: {
        login_email: params.login_email.toLocaleLowerCase(),
        is_super_admin: params.is_super_admin,
        first_name: params.first_name,
        last_name: params.last_name,
        member: params.is_member
          ? { create: { work_email: params.login_email, date_joined: new Date() } }
          : undefined,
      },
      include: { member: true },
    });
    console.log(newAccount);

    if (params.institute_id.length && newAccount.member != null) {
      await Promise.all(
        params.institute_id.map((instituteId) =>
          prisma.memberInstitute.create({
            data: {
              instituteId: instituteId,
              memberId: newAccount.member!.id,
            },
          })
        )
      );

      if (params.is_admin && newAccount.member) {
        await Promise.all(
          params.institute_id.map(
            (instituteId) =>
              newAccount.member &&
              prisma.instituteAdmin.create({
                data: {
                  accountId: newAccount.id,
                  instituteId: instituteId,
                  memberId: newAccount.member.id,
                },
              })
          )
        );
      }
    }

    return newAccount;
  });

  return transaction;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterAccountRes | string>
) {
  const params: RegisterAccountParams = req.body;
  console.log(params);
  const { login_email, first_name, last_name, is_admin } = params;
  if (typeof login_email !== "string")
    return res.status(400).send("Email is required.");
  if (typeof first_name !== "string")
    return res.status(400).send("First Name is required.");
  if (typeof last_name !== "string")
    return res.status(400).send("Last Name is required.");
  if (!["boolean", "undefined"].includes(typeof is_admin))
    return res.status(400).send("is_admin may only be boolean or undefined.");
  if (params.institute_id === undefined) {
    return res.status(400).send("Please provide at least one institute");
  }

  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    const newUser = await registerAccount(params);

    if (params.institute_id.length) {
    }

    return res.status(200).send(newUser);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return res
        .status(400)
        .send("This email is already registered: " + login_email);

    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
