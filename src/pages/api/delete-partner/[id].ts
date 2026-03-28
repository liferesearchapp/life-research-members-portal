import type { organization, Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
} from "../../../utils/api/authorization";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import type { PrivatePartnerDBRes } from "../partner/[id]/private";

async function deletePartner(
  organizationId: number
): Promise<organization | null> {
  // Begin a transaction
  const transaction = await db.$transaction(async (prisma) => {
    // Delete related OrganizationInstitute entries
    await prisma.organizationInstitute.deleteMany({
      where: { organizationId },
    });

    // Now safe to delete the organization itself
    return await prisma.organization.delete({
      where: { id: organizationId },
    });
  });

  return transaction;
}

function getPartnerAccessInfo(id: number) {
  return db.organization.findUnique({
    where: { id },
    select: {
      id: true,
      organizationInstitute: {
        select: {
          instituteId: true,
        },
      },
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Prisma.PromiseReturnType<typeof deletePartner> | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Partner ID is required.");

  try {
    const id = parseInt(req.query.id);

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;
    const partnerInfo = await getPartnerAccessInfo(id);
    if (!partnerInfo) return res.status(400).send("Partner not found. ID: " + id);
    if (
      !assertAuthorized(
        res,
        hasAnyInstituteAccess(
          currentAccount,
          partnerInfo.organizationInstitute.map((entry) => entry.instituteId)
        ),
        "You are not authorized to delete partners."
      )
    )
      return;

    const partner = await deletePartner(id);

    return res.status(200).send(partner);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
