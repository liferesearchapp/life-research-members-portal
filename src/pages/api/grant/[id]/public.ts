import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicGrantInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import methodAllowed from "../../../../utils/api/method-allowed";

export type PublicGrantRes = Awaited<ReturnType<typeof getPublicGrantInfo>>;

function getPublicGrantInfo(id: number) {
  return db.grant.findUnique({
    where: { id },
    select: selectPublicGrantInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicGrantRes | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Grant ID is required.");

  try {
    const id = parseInt(req.query.id);

    const grant = await getPublicGrantInfo(id);
    if (!grant) return res.status(400).send("Grant not found. ID: " + id);

    return res.status(200).send(grant);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
