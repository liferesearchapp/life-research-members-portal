import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicEventInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import methodAllowed from "../../../../utils/api/method-allowed";

export type PublicEventRes = Awaited<ReturnType<typeof getPublicEventInfo>>;

function getPublicEventInfo(id: number) {
  return db.event.findUnique({
    where: { id },
    select: selectPublicEventInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicEventRes | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Event ID is required.");

  try {
    const id = parseInt(req.query.id);
    const event = await getPublicEventInfo(id);
    if (!event) return res.status(400).send("Event not found. ID: " + id);

    return res.status(200).send(event);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
