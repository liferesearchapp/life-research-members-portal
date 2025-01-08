import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicMemberInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import type { PublicMemberRes } from "./member/[id]/public";

async function allMembers(urlIdentifier: string): Promise<PublicMemberRes[]> {
  const institute = await db.institute.findUnique({
    where: {
      urlIdentifier: urlIdentifier,
    },
    select: {
      id: true,
    },
  });
  if (!institute) throw new Error("Institute not found.");
  return db.member.findMany({
    where: {
      institutes: {
        some: {
          instituteId: institute.id,
        },
      },
    },
    select: selectPublicMemberInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicMemberRes[] | string>
) {
  const { instituteId } = req.query;
  if (!instituteId) return res.status(400).json("Please select an Institute.");

  try {
    return res.status(200).send(await allMembers(instituteId as string));
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
