import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import {
  assertAuthorized,
  canAccessAccount,
} from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import type { AccountDBRes } from "../../account/[id]";

export type UpdateAccountNameParams = { first_name?: string; last_name?: string };

function updateAccountName(
  id: number,
  { first_name, last_name }: UpdateAccountNameParams
): Promise<AccountDBRes> {
  return db.account.update({
    where: { id },
    data: { first_name, last_name },
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
    const params: UpdateAccountNameParams = req.body;

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;
    const account = await db.account.findUnique({
      where: { id },
      include: { member: { include: { institutes: true } } },
    });
    if (!account) return res.status(404).send("Account not found.");
    if (
      !assertAuthorized(
        res,
        canAccessAccount(currentAccount, account),
        "You are not authorized to edit account information."
      )
    )
      return;

    const updated = await updateAccountName(id, params);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
