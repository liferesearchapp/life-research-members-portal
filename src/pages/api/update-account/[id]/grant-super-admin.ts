import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import { assertAuthorized } from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import type { AccountDBRes } from "../../account/[id]";
import methodAllowed from "../../../../utils/api/method-allowed";
import withAudit from "../../../../utils/api/audit";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  if (!methodAllowed(req, res, ["PATCH"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Account ID is required.");

  const id = Number(req.query.id);
  if (!Number.isInteger(id))
    return res.status(400).send("Account ID must be a valid integer.");

  try {
    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    if (
      !assertAuthorized(
        res,
        currentAccount.is_super_admin,
        "Only super admins may grant super admin privileges."
      )
    )
      return;

    const accountExists = await db.account.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!accountExists) return res.status(404).send("Account not found.");

    const updatedAccount = await db.account.update({
      where: { id },
      data: { is_super_admin: true },
      include: includeAllAccountInfo,
    });

    return res.status(200).send(updatedAccount);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}

export default withAudit(handler, { action: "update-account/[id]/grant-super-admin" });
