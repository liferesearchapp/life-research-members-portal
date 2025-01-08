import type { NextApiRequest, NextApiResponse } from "next";
import type { AccountDBRes } from "../../account/[id]";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import db from "../../../../../prisma/prisma-client";
import { includeAllAccountInfo } from "../../../../../prisma/helpers";

export type addInstituteParams = {
  instituteId: number[];
};

async function addInstitute(id: number, params: addInstituteParams) {
  const accountToAdd = await db.account.findUnique({
    where: { id },
    include: { member: true },
  });
  if (!accountToAdd || !accountToAdd.member)
    throw new Error("Account not found");
  params.instituteId.map(async (instituteId) => {
    accountToAdd.member &&
      (await db.memberInstitute.upsert({
        where: {
          memberId_instituteId: {
            memberId: accountToAdd.member.id,
            instituteId: Number(instituteId),
          },
        },
        create: {
          memberId: accountToAdd?.member?.id,
          instituteId: Number(instituteId),
        },
        update: {},
      }));
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Institute ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params: addInstituteParams = req.body;

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    console.log({ id, params }, "id, params");

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
