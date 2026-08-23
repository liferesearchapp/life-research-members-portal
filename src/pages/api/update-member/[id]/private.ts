import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllMemberInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import type { MemberPrivateInfo } from "../../../../services/_types";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import type { PrivateMemberDBRes } from "../../member/[id]/private";

export type UpdateMemberPrivateParams = {
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postal_code?: string;
  mobile_phone?: string;
  date_joined?: string | null;
  activate?: boolean;
  deactivate?: boolean;
};

function updateMember(id: number, params: UpdateMemberPrivateParams) {
  let is_active, last_active;
  if (params.activate) is_active = true;
  else if (params.deactivate) {
    is_active = false;
    last_active = new Date();
  }
  return db.member.update({
    where: { id },
    data: {
      address: params.address,
      city: params.city,
      province: params.province,
      country: params.country,
      postal_code: params.postal_code,
      mobile_phone: params.mobile_phone,
      date_joined: params.date_joined,
      is_active,
      last_active,
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
    const params = req.body as UpdateMemberPrivateParams;

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
