import type { org_type } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import methodAllowed from "../../utils/api/method-allowed";

export default async function handler(req: NextApiRequest, res: NextApiResponse<org_type[]>) {
  if (!methodAllowed(req, res, ["GET"])) return;

  try {
    const OrgTypes = await db.org_type.findMany();
    return res.status(200).send(OrgTypes);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
