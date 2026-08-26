import type { level } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import methodAllowed from "../../utils/api/method-allowed";

export default async function handler(req: NextApiRequest, res: NextApiResponse<level[]>) {
  if (!methodAllowed(req, res, ["GET"])) return;

  try {
    const levels = await db.level.findMany();
    return res.status(200).send(levels);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
