import type { NextApiRequest, NextApiResponse } from "next";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import type { AccountDBRes } from "../account/[id]";
import methodAllowed from "../../../utils/api/method-allowed";

export default async function handler(req: NextApiRequest, res: NextApiResponse<AccountDBRes>) {
  if (!methodAllowed(req, res, ["GET"])) return;

  try {
    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;
    return res.status(200).send(currentAccount);
  } catch (e: any) {
    return res.status(500).send(e);
  }
}
