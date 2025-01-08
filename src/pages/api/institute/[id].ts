import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllInstituteInfo } from "../../../../prisma/helpers";
import db from "../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";

export type InstituteRes = Awaited<ReturnType<typeof getInstituteById>>;

function getInstituteById(id: number) {
  return db.institute.findUnique({
    where: { id },
    select: selectAllInstituteInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InstituteRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Institute ID is required.");

  try {
    const id = parseInt(req.query.id);

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;


    const institute = await getInstituteById(id);
    if (!institute) return res.status(400).send("Institute not found. ID: " + id);

    return res.status(200).send(institute);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
