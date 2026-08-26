import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicMemberInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import methodAllowed from "../../../../utils/api/method-allowed";

export type PublicMemberRes = Awaited<ReturnType<typeof getPublicMemberInfo>>;

function getPublicMemberInfo(id: number) {
  return db.member.findUnique({
    where: { id },
    select: selectPublicMemberInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicMemberRes | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Member ID is required.");

  try {
    const id = parseInt(req.query.id);

    const member = await getPublicMemberInfo(id);
    if (!member) return res.status(400).send("Member not found. ID: " + id);

    return res.status(200).send(member);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
