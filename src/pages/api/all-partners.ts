import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicPartnerInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import type { PublicPartnerRes } from "./partner/[id]/public";

async function allPartners(urlIdentifier: string): Promise<PublicPartnerRes[]> {
  const institute = await db.institute.findUnique({
    where: {
      urlIdentifier: urlIdentifier,
    },
    select: {
      id: true,
    },
  });

  if (!institute) throw new Error("Institute not found.");

  return db.organization.findMany({
    where: {
      organizationInstitute: {
        some: {
          instituteId: institute.id,
        },
      },
    },
    select: selectPublicPartnerInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicPartnerRes[] | string>
) {
  const { instituteId } = req.query;

  if (typeof instituteId !== "string") {
    return res.status(400).json("Institute identifier must be provided.");
  }

  try {
    const partners = await allPartners(instituteId);
    return res.status(200).send(partners);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}
