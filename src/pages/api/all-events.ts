import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicEventInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import requireInstituteAccess from "../../utils/api/require-institute-access";
import type { PublicEventRes } from "./event/[id]/public";

function allEvents(instituteId: number): Promise<PublicEventRes[]> {
  return db.event.findMany({
    where: { instituteId },
    select: selectPublicEventInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicEventRes[] | string>
) {
  const { instituteId } = req.query; // the institute's urlIdentifier
  if (typeof instituteId !== "string")
    return res.status(400).json("Institute identifier must be provided.");

  try {
    const id = await requireInstituteAccess(req, res, instituteId);
    if (id === null) return;
    return res.status(200).send(await allEvents(id));
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}
