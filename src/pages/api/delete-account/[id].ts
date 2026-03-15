import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../prisma/helpers";
import db from "../../../../prisma/prisma-client";
import {
  assertAuthorized,
  canAccessAccount,
} from "../../../utils/api/authorization";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import type { AccountDBRes } from "../account/[id]";

function deleteAccount(id: number): Promise<AccountDBRes> {
  return db.account.delete({
    where: { id },
    include: includeAllAccountInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Account ID is required.");

  try {
    const id = parseInt(req.query.id);

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;
    const accountToDelete = await db.account.findUnique({
      where: { id },
      include: { member: { include: { institutes: true } } },
    });
    if (!accountToDelete) return res.status(404).send("Account not found.");
    if (
      !assertAuthorized(
        res,
        canAccessAccount(currentAccount, accountToDelete),
        "You are not authorized to delete accounts."
      )
    )
      return;

    if (currentAccount.id === id)
      return res
        .status(401)
        .send("Admins may not delete themselves. This ensures there is always at least one admin.");

    const account = await deleteAccount(id);

    return res.status(200).send(account);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
