import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicPartnerInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import requireInstituteAccess from "../../utils/api/require-institute-access";
import type { PublicPartnerRes } from "./partner/[id]/public";
import methodAllowed from "../../utils/api/method-allowed";

function allPartners(instituteId: number): Promise<PublicPartnerRes[]> {
  return db.organization.findMany({
    where: { organizationInstitute: { some: { instituteId } } },
    select: selectPublicPartnerInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicPartnerRes[] | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

  const { instituteId } = req.query; // the institute's urlIdentifier
  if (typeof instituteId !== "string")
    return res.status(400).json("Institute identifier must be provided.");

  try {
    const id = await requireInstituteAccess(req, res, instituteId);
    if (id === null) return;
    return res.status(200).send(await allPartners(id));
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}
