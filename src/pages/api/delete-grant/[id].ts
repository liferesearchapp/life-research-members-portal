import type { grant, Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
} from "../../../utils/api/authorization";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import type { PrivateGrantDBRes } from "../grant/[id]/private";

async function deleteGrant(id: number): Promise<grant | null> {
  return db.grant.delete({
    where: { id },
  });
}

function getGrantAccessInfo(id: number) {
  return db.grant.findUnique({
    where: { id },
    select: { id: true, instituteId: true },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Prisma.PromiseReturnType<typeof deleteGrant> | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Grant ID is required.");

  try {
    const id = parseInt(req.query.id);

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    const grantInfo = await getGrantAccessInfo(id);
    if (!grantInfo) return res.status(400).send("Grant not found. ID: " + id);
    if (
      !assertAuthorized(
        res,
        hasAnyInstituteAccess(currentAccount, [grantInfo.instituteId]),
        "You are not authorized to delete grants."
      )
    )
      return;

    const grant = await deleteGrant(id);

    return res.status(200).send(grant);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
