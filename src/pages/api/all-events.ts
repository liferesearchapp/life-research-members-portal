import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import type { PublicEventRes } from "./event/[id]/public";
import { selectPublicEventInfo } from "../../../prisma/helpers";

// Adjusted to match the structure used in the grants part
async function allEvents(urlIdentifier: string): Promise<PublicEventRes[]> {
  const institute = await db.institute.findUnique({
    where: {
      urlIdentifier: urlIdentifier,
    },
    select: {
      id: true,
    },
  });

  if (!institute) throw new Error("Institute not found.");

  return db.event.findMany({
    where: {
      instituteId: institute.id,
    },
    select: selectPublicEventInfo,
    // Rest of your selection logic
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicEventRes[] | string>
) {
  const { instituteId } = req.query;

  if (typeof instituteId !== "string") {
    return res.status(400).json("Institute identifier must be provided.");
  }

  try {
    const events = await allEvents(instituteId);
    return res.status(200).send(events);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}
