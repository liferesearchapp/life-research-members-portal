import type { NextApiRequest, NextApiResponse } from "next";
import type { AccountDBRes } from "../../account/[id]";
import {
  assertAuthorized,
  hasAllInstituteAccess,
} from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import db from "../../../../../prisma/prisma-client";
import { includeAllAccountInfo } from "../../../../../prisma/helpers";
import { instituteMembershipInvitationStatus } from "../../../../utils/institute-membership-invitations";

export type addInstituteParams = {
  instituteId: number[];
  note?: string | null;
};

async function addInstitute(
  id: number,
  params: addInstituteParams,
  invitedByAccountId: number
) {
  const accountToInvite = await db.account.findUnique({
    where: { id },
    include: {
      member: {
        include: {
          institutes: true,
        },
      },
    },
  });

  if (!accountToInvite) throw new Error("Account not found.");

  const activeInstituteIds = new Set(
    accountToInvite.member?.institutes.map((entry) => entry.instituteId) ?? []
  );

  await Promise.all(
    params.instituteId.map(async (rawInstituteId) => {
      const instituteId = Number(rawInstituteId);
      if (!Number.isFinite(instituteId)) return;
      if (activeInstituteIds.has(instituteId)) return;

      await db.instituteMembershipInvitation.upsert({
        where: {
          accountId_instituteId: {
            accountId: id,
            instituteId,
          },
        },
        create: {
          accountId: id,
          instituteId,
          invitedByAccountId,
          status: instituteMembershipInvitationStatus.pending,
          note: params.note || null,
          respondedAt: null,
        },
        update: {
          invitedByAccountId,
          status: instituteMembershipInvitationStatus.pending,
          note: params.note || null,
          respondedAt: null,
        },
      });
    })
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Account ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params: addInstituteParams = req.body;
    if (!Array.isArray(params.instituteId))
      return res.status(400).send("Please provide one or more institute IDs.");

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;
    if (
      !assertAuthorized(
        res,
        hasAllInstituteAccess(currentAccount, params.instituteId),
        "You are not authorized to update institute memberships."
      )
    )
      return;

    await addInstitute(id, params, currentAccount.id);

    const updatedAccount = await db.account.findUnique({
      where: { id },
      include: includeAllAccountInfo,
    });

    return res.status(200).send(updatedAccount);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
