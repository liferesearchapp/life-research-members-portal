import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import type { AccountDBRes } from "../../account/[id]";

async function updateAccountGrantAdmin(id: number, urlIdentifier: string) {
  const institute = await db.institute.findUnique({
    where: {
      urlIdentifier: urlIdentifier,
    },
    select: {
      id: true,
    },
  });

  const account = await db.account.findUnique({
    where: {
      id,
    },
    include: {
      member: true,
    },
  });

  if (!institute || !account || !account.member) return null;

  return db.instituteAdmin.create({
    data: {
      accountId: id,
      instituteId: institute.id,
      memberId: account?.member.id,
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Account ID is required.");

  if (!req.query.instituteId || typeof req.query.instituteId !== "string")
    return res.status(400).send("Institute URL Identifier is required.");

  try {
    const id = parseInt(req.query.id);
    const urlIdentifier = req.query.instituteId as string;

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    const updated = await updateAccountGrantAdmin(id, urlIdentifier);

    const updatedAccount = await db.account.findUnique({
      where: {
        id,
      },
      include: includeAllAccountInfo,
    });

    return res.status(200).send(updatedAccount);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
