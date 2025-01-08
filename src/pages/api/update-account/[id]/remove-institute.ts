import type { NextApiRequest, NextApiResponse } from "next";
import type { AccountDBRes } from "../../account/[id]";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import db from "../../../../../prisma/prisma-client";
import { includeAllAccountInfo } from "../../../../../prisma/helpers";

export type RemoveInstituteParams = {
  instituteId: number[];
};

async function removeInstitute(id: number, params: RemoveInstituteParams) {
  const accountToRemoveFrom = await db.account.findUnique({
    where: { id },
    include: { member: { include: { institutes: true } } },
  });
  if (!accountToRemoveFrom || !accountToRemoveFrom.member)
    throw new Error("Account not found");

  for (const instituteId of params.instituteId) {
    if (
      accountToRemoveFrom.member.institutes.some(
        (inst) => inst.instituteId === instituteId
      )
    ) {
      await db.memberInstitute.delete({
        where: {
          memberId_instituteId: {
            memberId: accountToRemoveFrom.member.id,
            instituteId: Number(instituteId),
          },
        },
      });
      await db.instituteAdmin.deleteMany({
        where: {
          accountId: accountToRemoveFrom.id,
          instituteId: Number(instituteId),
        },
      });
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Account ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params: RemoveInstituteParams = req.body;

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    await removeInstitute(id, params);

    const updatedAccount = await db.account.findUnique({
      where: { id },
      include: includeAllAccountInfo,
    });

    return res.status(200).send(updatedAccount);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
