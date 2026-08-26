import type { target } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import methodAllowed from "../../utils/api/method-allowed";

export default async function handler(req: NextApiRequest, res: NextApiResponse<target[]>) {
  if (!methodAllowed(req, res, ["GET"])) return;

  try {
    const targets = await db.target.findMany();
    return res.status(200).send(targets);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
