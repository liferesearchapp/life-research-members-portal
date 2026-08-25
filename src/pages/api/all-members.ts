import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicMemberInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import requireInstituteAccess from "../../utils/api/require-institute-access";
import type { PublicMemberRes } from "./member/[id]/public";

function allMembers(instituteId: number): Promise<PublicMemberRes[]> {
  return db.member.findMany({
    where: { institutes: { some: { instituteId } } },
    select: selectPublicMemberInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicMemberRes[] | string>
) {
  // Despite the parameter name, this is the institute's urlIdentifier.
  const { instituteId } = req.query;
  if (!instituteId || typeof instituteId !== "string")
    return res.status(400).json("Please select an Institute.");

  try {
    const id = await requireInstituteAccess(req, res, instituteId);
    if (id === null) return; // requireInstituteAccess already sent 401/403/404
    return res.status(200).send(await allMembers(id));
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
