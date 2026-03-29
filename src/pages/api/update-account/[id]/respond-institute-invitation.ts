import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import type { AccountDBRes } from "../../account/[id]";
import {
  assertAuthorized,
} from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import { instituteMembershipInvitationStatus } from "../../../../utils/institute-membership-invitations";

export type RespondInstituteInvitationParams = {
  invitationId: number;
  action: "accept" | "reject";
};

async function respondToInvitation(
  accountId: number,
  params: RespondInstituteInvitationParams
) {
  const invitation = await db.instituteMembershipInvitation.findUnique({
    where: { id: params.invitationId },
  });

  if (!invitation || invitation.accountId !== accountId)
    throw new Error("Invitation not found.");

  if (invitation.status !== instituteMembershipInvitationStatus.pending)
    throw new Error("This invitation has already been processed.");

  return db.$transaction(async (prisma) => {
    if (params.action === "accept") {
      let member = await prisma.member.findUnique({
        where: { account_id: accountId },
      });

      if (!member) {
        const account = await prisma.account.findUnique({
          where: { id: accountId },
          select: { login_email: true },
        });
        if (!account) throw new Error("Account not found.");

        member = await prisma.member.create({
          data: {
            account_id: accountId,
            work_email: account.login_email,
            date_joined: new Date(),
          },
        });
      }

      await prisma.memberInstitute.upsert({
        where: {
          memberId_instituteId: {
            memberId: member.id,
            instituteId: invitation.instituteId,
          },
        },
        create: {
          memberId: member.id,
          instituteId: invitation.instituteId,
        },
        update: {},
      });

      await prisma.instituteMembershipInvitation.update({
        where: { id: invitation.id },
        data: {
          status: instituteMembershipInvitationStatus.accepted,
          respondedAt: new Date(),
        },
      });
    } else {
      await prisma.instituteMembershipInvitation.update({
        where: { id: invitation.id },
        data: {
          status: instituteMembershipInvitationStatus.rejected,
          respondedAt: new Date(),
        },
      });
    }

    return prisma.account.findUnique({
      where: { id: accountId },
      include: includeAllAccountInfo,
    });
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
    const params: RespondInstituteInvitationParams = req.body;
    if (typeof params.invitationId !== "number")
      return res.status(400).send("Invitation ID is required.");
    if (!["accept", "reject"].includes(params.action))
      return res.status(400).send("Action must be accept or reject.");

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;
    if (
      !assertAuthorized(
        res,
        currentAccount.id === id,
        "You are not authorized to respond to this invitation."
      )
    )
      return;

    const updated = await respondToInvitation(id, params);
    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}
