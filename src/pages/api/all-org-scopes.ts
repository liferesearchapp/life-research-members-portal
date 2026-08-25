import type { org_scope } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import methodAllowed from "../../utils/api/method-allowed";

export default async function handler(req: NextApiRequest, res: NextApiResponse<org_scope[]>) {
  if (!methodAllowed(req, res, ["GET"])) return;

  try {
    const OrgScope = await db.org_scope.findMany();
    return res.status(200).send(OrgScope);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
