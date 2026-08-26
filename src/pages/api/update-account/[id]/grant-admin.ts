import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import { assertAuthorized } from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import type { AccountDBRes } from "../../account/[id]";
import methodAllowed from "../../../../utils/api/method-allowed";
import withAudit from "../../../../utils/api/audit";

export async function updateAccountGrantAdmin(id: number, urlIdentifier: string) {
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
    select: { id: true },
  });

  if (!institute || !account) return null;

  return db.instituteAdmin.upsert({
    where: {
      accountId_instituteId: { accountId: id, instituteId: institute.id },
    },
    create: {
      accountId: id,
      instituteId: institute.id,
    },
    update: {},
  });
}

function getInstituteByUrlIdentifier(urlIdentifier: string) {
  return db.institute.findUnique({
    where: { urlIdentifier },
    select: { id: true },
  });
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  if (!methodAllowed(req, res, ["PATCH"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Account ID is required.");

  if (!req.query.instituteId || typeof req.query.instituteId !== "string")
    return res.status(400).send("Institute URL Identifier is required.");

  try {
    const id = parseInt(req.query.id);
    const urlIdentifier = req.query.instituteId as string;

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;
    const institute = await getInstituteByUrlIdentifier(urlIdentifier);
    if (!institute)
      return res.status(400).send("Institute URL Identifier is invalid.");
    if (
      !assertAuthorized(
        res,
        currentAccount.is_super_admin ||
          currentAccount.instituteAdmin.some(
            (admin) => admin.instituteId === institute.id
          ),
        "You are not authorized to grant admin permission."
      )
    )
      return;

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

export default withAudit(handler, { action: "update-account/[id]/grant-admin" });
