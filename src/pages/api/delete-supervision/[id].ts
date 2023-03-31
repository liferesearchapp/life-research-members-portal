import type { supervision, Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import type { PrivateSupervisionDBRes } from "../supervision/[id]/private";

async function deleteSupervision(id: number): Promise<supervision | null> {
  return db.supervision.delete({
    where: { id },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Prisma.PromiseReturnType<typeof deleteSupervision> | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Supervision ID is required.");

  try {
    const id = parseInt(req.query.id);

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    if (!currentAccount.is_admin)
      return res.status(401).send("You are not authorized to delete supervisions.");

    const supervision = await deleteSupervision(id);

    return res.status(200).send(supervision);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
