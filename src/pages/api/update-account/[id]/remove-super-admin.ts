import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import { assertAuthorized } from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import methodAllowed from "../../../../utils/api/method-allowed";
import withAudit from "../../../../utils/api/audit";
import type { AccountDBRes } from "../../account/[id]";

const MAX_TRANSACTION_ATTEMPTS = 3;

export class RemoveSuperAdminError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export class LastSuperAdminError extends RemoveSuperAdminError {
  constructor() {
    super(
      409,
      "The final super admin cannot be demoted. Grant super admin privileges to another account first."
    );
  }
}

function isTransactionConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

/**
 * Revokes super admin privileges.
 *
 * Two invariants, both of which exist to keep the system administrable:
 *
 *  - **The last super admin cannot be demoted.** Nobody could then grant the privilege back, and
 *    the system would have no one able to manage institutes or accounts.
 *  - **A super admin cannot demote themselves.** The same protection `delete-account` applies to
 *    self-deletion, and for the same reason: it is the easy way to lock yourself out by accident.
 *    Another super admin can always do it.
 *
 * The count and the update run in one serializable transaction, retried on conflict. Two super
 * admins demoting each other at the same moment would otherwise both read a count of two, both
 * proceed, and leave zero -- exactly the race `delete-account` already guards against.
 */
export async function removeSuperAdmin(id: number): Promise<AccountDBRes> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
    try {
      return await db.$transaction(
        async (prisma) => {
          const account = await prisma.account.findUnique({
            where: { id },
            select: { id: true, is_super_admin: true },
          });

          if (!account) throw new RemoveSuperAdminError(404, "Account not found.");
          if (!account.is_super_admin)
            throw new RemoveSuperAdminError(
              400,
              "This account does not have super admin privileges."
            );

          const superAdminCount = await prisma.account.count({
            where: { is_super_admin: true },
          });
          if (superAdminCount <= 1) throw new LastSuperAdminError();

          return prisma.account.update({
            where: { id },
            data: { is_super_admin: false },
            include: includeAllAccountInfo,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (!isTransactionConflict(error)) throw error;
      if (attempt === MAX_TRANSACTION_ATTEMPTS)
        throw new RemoveSuperAdminError(
          409,
          "The account changed while its privileges were being revoked. Please try again."
        );
    }
  }

  throw new Error("Unreachable transaction state.");
}

async function handler(req: NextApiRequest, res: NextApiResponse<AccountDBRes | string>) {
  if (!methodAllowed(req, res, ["PATCH"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Account ID is required.");

  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).send("Account ID must be a valid integer.");

  try {
    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    if (
      !assertAuthorized(
        res,
        currentAccount.is_super_admin,
        "Only super admins may revoke super admin privileges."
      )
    )
      return;

    if (currentAccount.id === id)
      return res
        .status(400)
        .send(
          "Super admins may not revoke their own privileges. Ask another super admin to do it."
        );

    const updated = await removeSuperAdmin(id);
    return res.status(200).send(updated);
  } catch (e: any) {
    if (e instanceof RemoveSuperAdminError) return res.status(e.status).send(e.message);
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}

export default withAudit(handler, { action: "update-account/[id]/remove-super-admin" });
