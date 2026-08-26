import type { NextApiRequest, NextApiResponse } from "next";
import type { AccountDBRes } from "../../account/[id]";
import {
  assertAuthorized,
  hasAllInstituteAccess,
} from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import db from "../../../../../prisma/prisma-client";
import { includeAllAccountInfo } from "../../../../../prisma/helpers";
import methodAllowed from "../../../../utils/api/method-allowed";
import withAudit from "../../../../utils/api/audit";

export type addInstituteParams = {
  instituteId: number[];
};

// Adds the account directly to the given institutes as a member.
// A member profile is created automatically if the account does not have one yet.
async function addInstitute(id: number, params: addInstituteParams) {
  const account = await db.account.findUnique({
    where: { id },
    select: { id: true, login_email: true, member: { select: { id: true } } },
  });

  if (!account) throw new Error("Account not found.");

  await db.$transaction(async (prisma) => {
    let memberId = account.member?.id;
    if (!memberId) {
      const createdMember = await prisma.member.create({
        data: {
          account_id: id,
          work_email: account.login_email,
          date_joined: new Date(),
        },
      });
      memberId = createdMember.id;
    }

    await Promise.all(
      params.instituteId.map(async (rawInstituteId) => {
        const instituteId = Number(rawInstituteId);
        if (!Number.isFinite(instituteId)) return;

        await prisma.memberInstitute.upsert({
          where: {
            memberId_instituteId: {
              memberId: memberId!,
              instituteId,
            },
          },
          create: {
            memberId: memberId!,
            instituteId,
          },
          update: {},
        });
      })
    );
  });
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  if (!methodAllowed(req, res, ["PATCH"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Account ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params: addInstituteParams = req.body;
    if (!Array.isArray(params.instituteId))
      return res.status(400).send("Please provide one or more institute IDs.");

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;
    if (
      !assertAuthorized(
        res,
        hasAllInstituteAccess(currentAccount, params.instituteId),
        "You are not authorized to update institute memberships."
      )
    )
      return;

    await addInstitute(id, params);

    const updatedAccount = await db.account.findUnique({
      where: { id },
      include: includeAllAccountInfo,
    });

    return res.status(200).send(updatedAccount);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}

export default withAudit(handler, { action: "update-account/[id]/add-institute" });
