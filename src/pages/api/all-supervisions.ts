import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicSupervisionInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import type { PublicSupervisionRes } from "./supervision/[id]/public";

async function allSupervisions(
  urlIdentifier: string
): Promise<PublicSupervisionRes[]> {
  const institute = await db.institute.findUnique({
    where: {
      urlIdentifier: urlIdentifier,
    },
    select: {
      id: true,
    },
  });
  if (!institute) throw new Error("Institute not found.");
  return db.supervision.findMany({
    where: {
      instituteId: institute.id,
    },
    select: selectPublicSupervisionInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicSupervisionRes[] | string>
) {
  const { instituteId } = req.query;

  if (typeof instituteId !== "string") {
    return res.status(400).json("Institute identifier must be provided.");
  }
  try {
    return res.status(200).send(await allSupervisions(instituteId));
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
