import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllInstituteInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import type { InstituteInfo } from "../../../../services/_types";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
} from "../../../../utils/api/authorization";
import methodAllowed from "../../../../utils/api/method-allowed";
import withAudit from "../../../../utils/api/audit";

export type UpdateInstituteParams = {
  name: string;
  name_fr?: string | null;
  urlIdentifier: string;
  description_en?: string | null;
  description_fr?: string | null;
  largeLogo?: string | null;
  smallLogoEn?: string | null;
  smallLogoFr?: string | null;
  primaryColor?: string | null;
  primaryColorDark?: string | null;
  secondaryColor?: string | null;
  secondaryColorDark?: string | null;
  accentColor?: string | null;
  is_active: boolean;
};

const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/i;
const MAX_LOGO_DATA_LENGTH = 1_500_000;

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeColor(value: string | null | undefined) {
  const trimmed = value?.trim().toUpperCase();
  if (!trimmed) return null;
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    throw new Error("Theme colors must be valid 6-digit hex values.");
  }
  return trimmed;
}

function normalizeLogo(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_LOGO_DATA_LENGTH) {
    throw new Error("Logo image is too large.");
  }

  const isDataImage = /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(trimmed);
  const isLocalPath = trimmed.startsWith("/");
  const isRemoteUrl =
    trimmed.startsWith("http://") || trimmed.startsWith("https://");

  if (!isDataImage && !isLocalPath && !isRemoteUrl) {
    throw new Error("Logo must be an uploaded image or a valid image URL.");
  }

  return trimmed;
}

function buildUpdateData(
  params: UpdateInstituteParams,
  currentUser: { is_super_admin: boolean }
) {
  const data: Record<string, unknown> = {
    name: params.name.trim(),
    name_fr: normalizeText(params.name_fr),
    description_en: normalizeText(params.description_en),
    description_fr: normalizeText(params.description_fr),
    largeLogo: normalizeLogo(params.largeLogo),
    smallLogoEn: normalizeLogo(params.smallLogoEn),
    smallLogoFr: normalizeLogo(params.smallLogoFr),
    primaryColor: normalizeColor(params.primaryColor),
    primaryColorDark: normalizeColor(params.primaryColorDark),
    secondaryColor: normalizeColor(params.secondaryColor),
    secondaryColorDark: normalizeColor(params.secondaryColorDark),
    accentColor: normalizeColor(params.accentColor),
  };

  if (currentUser.is_super_admin) {
    data.urlIdentifier = params.urlIdentifier.trim();
    data.is_active = params.is_active;
  }

  return data;
}

function updateInstitute(id: number, params: UpdateInstituteParams, currentUser: { is_super_admin: boolean }) {
  return db.institute.update({
    where: { id },
    data: buildUpdateData(params, currentUser),
    select: selectAllInstituteInfo,
  });
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InstituteInfo | string>
) {
  if (!methodAllowed(req, res, ["PATCH"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Institute ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params = req.body as UpdateInstituteParams;

    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    const authorized = hasAnyInstituteAccess(currentUser, [id], {
      allowAdmin: true,
      allowMember: false,
      allowSuperAdmin: true,
    });

    if (
      !assertAuthorized(
        res,
        authorized,
        "You are not authorized to update that institute."
      )
    )
      return;

    const updated = await updateInstitute(id, params, currentUser);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}

export default withAudit(handler, { action: "update-institute/[id]/private" });
