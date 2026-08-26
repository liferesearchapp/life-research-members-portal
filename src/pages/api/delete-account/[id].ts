import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../prisma/helpers";
import db from "../../../../prisma/prisma-client";
import { canAccessAccount } from "../../../utils/api/authorization";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import type { AccountDBRes } from "../account/[id]";
import methodAllowed from "../../../utils/api/method-allowed";

const MAX_TRANSACTION_ATTEMPTS = 3;

export class AccountDeletionError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export class LastSuperAdminError extends AccountDeletionError {
  constructor() {
    super(
      409,
      "The final super admin cannot be deleted. Grant super admin privileges to another account first."
    );
  }
}

function isTransactionConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
  );
}

export async function deleteAccount(
  id: number,
  currentAccount: NonNullable<AccountDBRes>
): Promise<AccountDBRes> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
    try {
      return await db.$transaction(
        async (prisma) => {
          const account = await prisma.account.findUnique({
            where: { id },
            include: { member: { include: { institutes: true } } },
          });

          if (!account)
            throw new AccountDeletionError(404, "Account not found.");

          if (account.is_super_admin && !currentAccount.is_super_admin)
            throw new AccountDeletionError(
              401,
              "Only super admins may delete another super admin account."
            );

          if (!canAccessAccount(currentAccount, account))
            throw new AccountDeletionError(
              401,
              "You are not authorized to delete accounts."
            );

          if (account.is_super_admin) {
            const superAdminCount = await prisma.account.count({
              where: { is_super_admin: true },
            });
            if (superAdminCount <= 1) throw new LastSuperAdminError();
          }

          await prisma.instituteMembershipInvitation.deleteMany({
            where: {
              OR: [{ accountId: id }, { invitedByAccountId: id }],
            },
          });

          // These junction tables reference the account/member without an
          // ON DELETE CASCADE rule, so they must be removed before the account
          // (and its cascaded member profile) can be deleted.
          await prisma.instituteAdmin.deleteMany({ where: { accountId: id } });

          if (account.member) {
            await prisma.memberInstitute.deleteMany({
              where: { memberId: account.member.id },
            });
          }

          return prisma.account.delete({
            where: { id },
            include: includeAllAccountInfo,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (!isTransactionConflict(error)) throw error;
      if (attempt === MAX_TRANSACTION_ATTEMPTS)
        throw new AccountDeletionError(
          409,
          "The account changed during deletion. Please try again."
        );
    }
  }

  throw new Error("Unreachable transaction state.");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  if (!methodAllowed(req, res, ["DELETE"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Account ID is required.");

  try {
    const id = parseInt(req.query.id);

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    if (currentAccount.id === id)
      return res
        .status(401)
        .send("Admins may not delete themselves. This ensures there is always at least one admin.");

    const account = await deleteAccount(id, currentAccount);

    return res.status(200).send(account);
  } catch (e: any) {
    if (e instanceof AccountDeletionError)
      return res.status(e.status).send(e.message);
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
