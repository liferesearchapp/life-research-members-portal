import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import getAccountFromRequest from "../../utils/api/get-account-from-request";

export type RegisterPartnerParams = {
  name_en: string;
  name_fr: string;
  scope_id: number;
  type_id: number;
  description: string;
  institute_id: number[];
};
export type RegisterPartnerRes = Awaited<ReturnType<typeof registerPartner>>;

function registerPartner(params: RegisterPartnerParams) {
  return db.organization.create({
    data: {
      name_en: params.name_en,
      name_fr: params.name_fr,
      scope_id: Number(params.scope_id),
      type_id: Number(params.type_id),
      description: params.description,
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterPartnerRes | string>
) {
  const params: RegisterPartnerParams = req.body;
  const { name_en, name_fr, scope_id, type_id } = params;
  if (typeof name_en !== "string")
    return res.status(400).send("name_en is required.");
  if (typeof name_fr !== "string")
    return res.status(400).send("name_fr is required.");
  if (isNaN(scope_id)) return res.status(400).send("scope_id is required.");
  if (isNaN(scope_id)) return res.status(400).send("type_id is required.");

  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    if (params.institute_id === undefined) {
      return res.status(400).send("Please provide at least one institute");
    }

    // Check if partner already exists
    const existingPartner = await db.organization.findFirst({
      where: {
        OR: [{ name_en: params.name_en }, { name_fr: params.name_fr }],
      },
    });

    if (existingPartner) {
      return res
        .status(400)
        .send("This partner is already registered: " + name_en);
    }

    const newPartner = await registerPartner(params);

    await Promise.all(
      params.institute_id.map((instituteId) =>
        db.organizationInstitute.create({
          data: {
            instituteId: instituteId,
            organizationId: newPartner.id,
          },
        })
      )
    );

    return res.status(200).send(newPartner);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return res
        .status(400)
        .send("This partner is already registered: " + name_en);

    return res.status(500).send({ ...e, message: e.message });
  }
}
