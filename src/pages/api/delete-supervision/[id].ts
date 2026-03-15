import type { supervision, Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
} from "../../../utils/api/authorization";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import type { PrivateSupervisionDBRes } from "../supervision/[id]/private";

async function deleteSupervision(id: number): Promise<supervision | null> {
  return db.supervision.delete({
    where: { id },
  });
}

function getSupervisionAccessInfo(id: number) {
  return db.supervision.findUnique({
    where: { id },
    select: { id: true, instituteId: true },
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
    const supervisionInfo = await getSupervisionAccessInfo(id);
    if (!supervisionInfo)
      return res.status(400).send("Supervision not found. ID: " + id);
    if (
      !assertAuthorized(
        res,
        hasAnyInstituteAccess(currentAccount, [supervisionInfo.instituteId], {
          allowAdmin: true,
          allowMember: true,
          allowSuperAdmin: true,
        }),
        "You are not authorized to delete supervisions."
      )
    )
      return;

    const supervision = await deleteSupervision(id);

    return res.status(200).send(supervision);
  } catch (e: any) {
    //if (e.code === "P2003") {
    //return res.status(409).send("Cannot delete supervision due to related supervision member records. Please delete related records first.");
    //}
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
