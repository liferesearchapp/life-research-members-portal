import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../prisma/helpers";
import db from "../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import type { AccountDBRes } from "../account/[id]";
import methodAllowed from "../../../utils/api/method-allowed";
import withAudit from "../../../utils/api/audit";

function updateAccountLastLogin(id: number): Promise<AccountDBRes> {
  return db.account.update({
    where: { id },
    data: { last_login: new Date() },
    include: includeAllAccountInfo,
  });
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  // POST, not GET: this route stamps account.last_login, and a write does not belong on a verb
  // that browsers, proxies, and retry logic are entitled to treat as safe and repeatable.
  if (!methodAllowed(req, res, ["POST"])) return;

  try {
    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    const updated = await updateAccountLastLogin(currentAccount.id);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}

export default withAudit(handler, { action: "active-account/update-last-login" });
