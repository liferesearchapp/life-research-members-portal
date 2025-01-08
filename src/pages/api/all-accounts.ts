import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import getAccountFromRequest from "../../utils/api/get-account-from-request";
import type { AccountDBRes } from "./account/[id]";

function getAllAccounts(): Promise<AccountDBRes[]> {
  return db.account.findMany({
    include: includeAllAccountInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes[] | string>
) {
  try {
    const currentUser = await getAccountFromRequest(req, res);

    if (!currentUser) return;

    const accounts = await getAllAccounts();

    return res.status(200).send(accounts);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
