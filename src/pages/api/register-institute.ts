import { institute, Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import getAccountFromRequest from "../../utils/api/get-account-from-request";

export type RegisterInstituteParams = {
  name: string;
  urlIdentifier: string;
  description_en?: string;
  description_fr?: string;
};
export type RegisterInstituteRes = Awaited<
  ReturnType<typeof registerInstitute>
>;

function registerInstitute(params: RegisterInstituteParams) {
  return db.institute.create({
    data: {
      name: params.name,
      urlIdentifier: params.urlIdentifier,
      description_en: params.description_en,
      description_fr: params.description_fr,
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterInstituteRes | string>
) {
  const params: RegisterInstituteParams = req.body;

  const { name, urlIdentifier } = params;
  if (typeof name !== "string")
    return res.status(400).send("Name is required.");
  if (typeof urlIdentifier !== "string")
    return res.status(400).send("URL Identifier is required.");

  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    if (!currentUser.is_super_admin)
      return res
        .status(401)
        .send("You are not authorized to register institutes.");

    const currentMember = await db.member.findUnique({
      where: { account_id: currentUser.id },
    });

    if (!currentMember)
      return res
        .status(401)
        .send("You are not authorized to register institutes.");

    const newInstitute = await registerInstitute(params);

    await db.memberInstitute.create({
      data: {
        memberId: currentMember.id,
        instituteId: newInstitute.id,
      },
    });

    return res.status(200).send(newInstitute);
  } catch (e: any) {
    // Handle unique constraint violation (e.g., name or urlIdentifier already exists)
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return res
        .status(400)
        .send("This name or URL identifier is already in use.");
    }

    return res.status(500).send({ ...e, message: e.message }); // Adjust this according to how you handle errors
  }
}
