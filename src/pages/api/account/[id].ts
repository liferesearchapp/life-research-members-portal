import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../prisma/helpers";
import db from "../../../../prisma/prisma-client";
import {
  assertAuthorized,
  canAccessAccount,
} from "../../../utils/api/authorization";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import type { PrivateMemberRes } from "../member/[id]/private";

export type AccountDBRes = Awaited<ReturnType<typeof getAccountById>>;

// Dates will be stringified when sending response!
export type AccountRes = Omit<NonNullable<AccountDBRes>, "member" | "last_login"> & {
  member: PrivateMemberRes | null;
  last_login: string | null;
};

function getAccountById(id: number) {
  return db.account.findUnique({
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

    const account = await getAccountById(id);
    if (!account) return res.status(400).send("Account not found. ID: " + id);
    if (
      !assertAuthorized(
        res,
        canAccessAccount(currentAccount, account, { allowSelf: true }),
        "You are not authorized to view this account information."
      )
    )
      return;

    return res.status(200).send(account);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
