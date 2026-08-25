import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicSupervisionInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import requireInstituteAccess from "../../utils/api/require-institute-access";
import type { PublicSupervisionRes } from "./supervision/[id]/public";

function allSupervisions(instituteId: number): Promise<PublicSupervisionRes[]> {
  return db.supervision.findMany({
    where: { instituteId },
    select: selectPublicSupervisionInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicSupervisionRes[] | string>
) {
  const { instituteId } = req.query; // the institute's urlIdentifier
  if (typeof instituteId !== "string")
    return res.status(400).json("Institute identifier must be provided.");

  try {
    const id = await requireInstituteAccess(req, res, instituteId);
    if (id === null) return;
    return res.status(200).send(await allSupervisions(id));
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}
