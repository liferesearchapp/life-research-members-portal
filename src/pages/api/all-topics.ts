import type { topic } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<topic[] | string>
) {
  if (req.method !== "GET") return res.status(405).end();
  if (!req.query.instituteId || typeof req.query.instituteId !== "string")
    return res.status(400).send("Institute URL identifier is required.");

  try {
    const topics = await db.topic.findMany({
      where: {
        institutes: {
          some: {
            is_active: true,
            institute: { urlIdentifier: req.query.instituteId },
          },
        },
      },
    });
    return res.status(200).send(topics);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
