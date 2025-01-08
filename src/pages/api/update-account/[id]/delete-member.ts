import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import type { AccountDBRes } from "../../account/[id]";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";

function deleteMember(id: number) {
  return db.member.delete({ where: { id } });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Account ID is required.");

  try {
    const id = parseInt(req.query.id);

    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    const account = await db.account.findUnique({
      where: { id },
      include: { member: true },
    });

    if (!account?.member) return res.status(404).send("Member not found.");
    await db.memberInstitute.deleteMany({
      where: { memberId: account?.member?.id },
    });

    await db.instituteAdmin.deleteMany({
      where: { memberId: account?.member?.id },
    });

    await deleteMember(account?.member?.id);

    const updated = await db.account.findUnique({
      where: { id },
      include: includeAllAccountInfo,
    });

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
