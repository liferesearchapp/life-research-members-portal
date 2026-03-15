import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicGrantInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import type { PublicGrantRes } from "./grant/[id]/public";

async function allGrants(urlIdentifier: string): Promise<PublicGrantRes[]> {
  const institute = await db.institute.findUnique({
    where: {
      urlIdentifier: urlIdentifier,
    },
    select: {
      id: true,
    },
  });

  if (!institute) throw new Error("Institute not found.");

  return db.grant.findMany({
    where: {
      instituteId: institute.id,
    },
    select: selectPublicGrantInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicGrantRes[] | string>
) {
  const { instituteId } = req.query;

  if (typeof instituteId !== "string") {
    return res.status(400).json("Institute identifier must be provided.");
  }

  try {
    const grants = await allGrants(instituteId);
    return res.status(200).send(grants);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}
