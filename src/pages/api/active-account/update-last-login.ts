import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../prisma/helpers";
import db from "../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import type { AccountDBRes } from "../account/[id]";
import methodAllowed from "../../../utils/api/method-allowed";

function updateAccountLastLogin(id: number): Promise<AccountDBRes> {
  return db.account.update({
    where: { id },
    data: { last_login: new Date() },
    include: includeAllAccountInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  // GET, because that is what the client sends (src/services/context/active-account-ctx.tsx).
  // Note this route WRITES on a GET -- it stamps account.last_login. Gating it to POST would be
  // more correct but breaks that caller, so the verb is recorded here as-is rather than changed
  // silently; fixing it is a coordinated client + server change.
  if (!methodAllowed(req, res, ["GET"])) return;

  try {
    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    const updated = await updateAccountLastLogin(currentAccount.id);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
