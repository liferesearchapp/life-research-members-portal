import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllPartnerInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import type { PartnerPrivateInfo } from "../../../../services/_types";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import type { PrivatePartnerRes } from "../../partner/[id]/private";

export type UpdatePartnerPublicParams = {
  name_en: string;
  name_fr: string;
  scope_id: number | null;
  type_id: number | null;
  description: string | null;
  institute_id: number[];
};

function updatePartner(
  id: number,
  {
    name_en,
    name_fr,
    scope_id,
    type_id,
    description,
  }: UpdatePartnerPublicParams
) {
  return db.organization.update({
    where: { id },
    data: {
      name_en,
      name_fr,
      org_scope: scope_id
        ? { connect: { id: scope_id } }
        : scope_id === null
        ? { disconnect: true }
        : undefined,
      org_type: type_id
        ? { connect: { id: type_id } }
        : type_id === null
        ? { disconnect: true }
        : undefined,
      description,
    },
    select: selectAllPartnerInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivatePartnerRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Partner ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params = req.body as UpdatePartnerPublicParams;

    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    const authorized = currentUser.is_admin || currentUser.member?.id === id;
    if (!authorized)
      return res
        .status(401)
        .send("You are not authorized to edit this partner information.");

    const updated = await updatePartner(id, params);

    await db.organizationInstitute.deleteMany({
      where: {
        organizationId: id,
      },
    });

    await db.organizationInstitute.createMany({
      data: params.institute_id.map((instituteId) => ({
        instituteId,
        organizationId: id,
      })),
    });

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
