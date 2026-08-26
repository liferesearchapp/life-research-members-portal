import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllPartnerInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import type { PartnerPrivateInfo } from "../../../../services/_types";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import {
  assertAuthorized,
  hasAllInstituteAccess,
  hasAnyInstituteAccess,
} from "../../../../utils/api/authorization";
import type { PrivatePartnerRes } from "../../partner/[id]/private";
import methodAllowed from "../../../../utils/api/method-allowed";
import withAudit from "../../../../utils/api/audit";

export type UpdatePartnerPublicParams = {
  name_en: string;
  name_fr: string;
  scope_id: number | null;
  type_id: number | null;
  description: string | null;
  institute_id: number[];
};

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

function updatePartner(
  id: number,
  {
    name_en,
    name_fr,
    scope_id,
    type_id,
    description,
  }: UpdatePartnerPublicParams
) {
  return db.organization.update({
    where: { id },
    data: {
      name_en,
      name_fr,
      org_scope: scope_id
        ? { connect: { id: scope_id } }
        : scope_id === null
        ? { disconnect: true }
        : undefined,
      org_type: type_id
        ? { connect: { id: type_id } }
        : type_id === null
        ? { disconnect: true }
        : undefined,
      description,
    },
    select: selectAllPartnerInfo,
  });
}

function getNormalizedInstituteIds(instituteIds: Iterable<number | null | undefined>) {
  return Array.from(
    new Set(
      Array.from(instituteIds).filter(
        (instituteId): instituteId is number =>
          typeof instituteId === "number" && Number.isFinite(instituteId)
      )
    )
  ).sort((a, b) => a - b);
}

function haveSameInstituteIds(
  currentInstituteIds: Iterable<number | null | undefined>,
  nextInstituteIds: Iterable<number | null | undefined>
) {
  const current = getNormalizedInstituteIds(currentInstituteIds);
  const next = getNormalizedInstituteIds(nextInstituteIds);

  if (current.length !== next.length) return false;

  return current.every((instituteId, index) => instituteId === next[index]);
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivatePartnerRes | string>
) {
  if (!methodAllowed(req, res, ["PATCH"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Partner ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params = req.body as UpdatePartnerPublicParams;

    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;
    const partner = await getPartnerAccessInfo(id);
    if (!partner) return res.status(400).send("Partner not found. ID: " + id);
    const currentInstituteIds = partner.organizationInstitute.map(
      (entry) => entry.instituteId
    );
    if (
      !assertAuthorized(
        res,
        hasAnyInstituteAccess(currentUser, currentInstituteIds),
        "You are not authorized to edit this partner information."
      )
    )
      return;
    if (
      !haveSameInstituteIds(currentInstituteIds, params.institute_id) &&
      !assertAuthorized(
        res,
        hasAllInstituteAccess(currentUser, params.institute_id),
        "You are not authorized to assign this partner to the selected institutes."
      )
    )
      return;

    const updated = await updatePartner(id, params);

    await db.organizationInstitute.deleteMany({
      where: {
        organizationId: id,
      },
    });

    await db.organizationInstitute.createMany({
      data: params.institute_id.map((instituteId) => ({
        instituteId,
        organizationId: id,
      })),
    });

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}

export default withAudit(handler, { action: "update-partner/[id]/public" });
