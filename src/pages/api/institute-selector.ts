import db from "../../../prisma/prisma-client";
import type { NextApiRequest, NextApiResponse } from "next";

export type InstituteSelectorRes = {
    id: number;
    name: string;
    urlIdentifier: string;
    description_en: string |null;
    description_fr: string | null;
    is_active: boolean;
};

async function getAllInstitutesForSelector(): Promise<InstituteSelectorRes[]>{
    const instituteSelection: InstituteSelectorRes[] = await db.institute.findMany({
        select: {
            id: true,
            name: true,
            urlIdentifier: true,
            description_en: true,
            description_fr: true,
            is_active: true,
        },
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
      const instituteSelection = await getAllInstitutesForSelector();
      return res.status(200).send(instituteSelection);
    } catch (e: any) {
      return res.status(500).send({ ...e, message: e.message });
    }
  }