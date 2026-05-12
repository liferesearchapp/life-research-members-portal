import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllMemberInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import type { PrivateMemberDBRes } from "../../member/[id]/private";

export type UpdateMemberInsightParams = {
  interview_date?: string | null;
  about_member?: string;
  about_promotions?: string;
  dream?: string;
  how_can_we_help?: string;
  admin_notes?: string;
  other_notes?: string;
};

function updateMember(id: number, params: UpdateMemberInsightParams) {
  return db.member.update({
    where: { id },
    data: {
      insight: {
        upsert: {
          update: {
            interview_date: params.interview_date,
            about_member: params.about_member,
            about_promotions: params.about_promotions,
            dream: params.dream,
            how_can_we_help: params.how_can_we_help,
            admin_notes: params.admin_notes,
            other_notes: params.other_notes,
          },
          create: {
            interview_date: params.interview_date,
            about_member: params.about_member,
            about_promotions: params.about_promotions,
            dream: params.dream,
            how_can_we_help: params.how_can_we_help,
            admin_notes: params.admin_notes,
            other_notes: params.other_notes,
          },
        },
      },
    },
    include: includeAllMemberInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivateMemberDBRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Member ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params = req.body as UpdateMemberInsightParams;

    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    const memberInstitutes = await db.memberInstitute.findMany({
      where: { memberId: id },
      select: {
        instituteId: true,
      },
    });

    //check if user is admin of any member institutes:
    const isUserAdmin = currentUser.instituteAdmin.some((admin) =>
      memberInstitutes.some(
        (institute) => institute.instituteId === admin.instituteId
      )
    );

    const isUsersMember = currentUser.member?.id === id;

    const authorized =
      currentUser.is_super_admin || isUserAdmin || isUsersMember;

    if (!authorized)
      return res
        .status(401)
        .send("You are not authorized to update that member.");



    const updated = await updateMember(id, params);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
