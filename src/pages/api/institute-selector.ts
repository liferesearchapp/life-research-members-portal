import db from "../../../prisma/prisma-client";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getVisibleInstituteIds,
} from "../../utils/api/authorization";
import getAccountFromRequest from "../../utils/api/get-account-from-request";

export type InstituteSelectorRes = {
    id: number;
    name: string;
    urlIdentifier: string;
    description_en: string |null;
    description_fr: string | null;
    largeLogo: string | null;
    smallLogoEn: string | null;
    smallLogoFr: string | null;
    primaryColor: string | null;
    primaryColorDark: string | null;
    secondaryColor: string | null;
    secondaryColorDark: string | null;
    accentColor: string | null;
    is_active: boolean;
};

const instituteSelectorSelect = {
  id: true,
  name: true,
  urlIdentifier: true,
  description_en: true,
  description_fr: true,
  largeLogo: true,
  smallLogoEn: true,
  smallLogoFr: true,
  primaryColor: true,
  primaryColorDark: true,
  secondaryColor: true,
  secondaryColorDark: true,
  accentColor: true,
  is_active: true,
} as const;

async function getInstitutesForSelector(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<InstituteSelectorRes[] | null> {
    if (!req.headers.authorization) {
      return db.institute.findMany({
        where: { is_active: true },
        select: instituteSelectorSelect,
      });
    }

    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return null;

    if (currentUser.is_super_admin) {
      return db.institute.findMany({
        where: { is_active: true },
        select: instituteSelectorSelect,
      });
    }

    const visibleInstituteIds = Array.from(getVisibleInstituteIds(currentUser));

    const instituteSelection: InstituteSelectorRes[] = await db.institute.findMany({
        where: { id: { in: visibleInstituteIds }, is_active: true },
        select: instituteSelectorSelect,
    });

    if (!instituteSelection) {
        throw new Error("No institutes found.");
    }

    return instituteSelection;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<InstituteSelectorRes[] | string>
  ) {
    try {
      const instituteSelection = await getInstitutesForSelector(req, res);
      if (!instituteSelection) return;
      return res.status(200).send(instituteSelection);
    } catch (e: any) {
      return res.status(500).send({ ...e, message: e.message });
    }
  }
