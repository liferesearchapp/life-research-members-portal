import type { topic } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
} from "../../utils/api/authorization";
import getAccountFromRequest from "../../utils/api/get-account-from-request";
import methodAllowed from "../../utils/api/method-allowed";

export type InstituteTopicInfo = topic & { is_active: boolean };
export type RegisterInstituteTopicParams = {
  institute_id: number;
  name_en: string;
  name_fr: string;
};

function normalizeTopicName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function authorizeInstituteAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
  instituteId: number
) {
  const currentUser = await getAccountFromRequest(req, res);
  if (!currentUser) return null;

  if (
    !assertAuthorized(
      res,
      hasAnyInstituteAccess(currentUser, [instituteId], {
        allowAdmin: true,
        allowMember: false,
        allowSuperAdmin: true,
      }),
      "You are not authorized to manage topics for this institute."
    )
  )
    return null;

  return currentUser;
}

async function getInstituteTopics(instituteId: number) {
  const mappings = await db.instituteTopic.findMany({
    where: { instituteId },
    include: { topic: true },
    orderBy: { topic: { name_en: "asc" } },
  });

  return mappings.map(({ topic, is_active }) => ({ ...topic, is_active }));
}

async function registerInstituteTopic(params: RegisterInstituteTopicParams) {
  return db.$transaction(async (transaction) => {
    const newTopic = await transaction.topic.create({
      data: { name_en: params.name_en, name_fr: params.name_fr },
    });

    await transaction.instituteTopic.create({
      data: {
        instituteId: params.institute_id,
        topicId: newTopic.id,
        is_active: true,
      },
    });

    return { ...newTopic, is_active: true };
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InstituteTopicInfo[] | InstituteTopicInfo | string>
) {
  if (!methodAllowed(req, res, ["GET", "POST"])) return;

  const instituteId =
    req.method === "GET"
      ? Number(req.query.instituteId)
      : Number(req.body?.institute_id);

  if (!Number.isInteger(instituteId) || instituteId <= 0)
    return res.status(400).send("A valid institute ID is required.");

  try {
    const currentUser = await authorizeInstituteAdmin(req, res, instituteId);
    if (!currentUser) return;

    if (req.method === "GET") {
      return res.status(200).send(await getInstituteTopics(instituteId));
    }

    if (req.method === "POST") {
      const name_en = normalizeTopicName(req.body?.name_en);
      const name_fr = normalizeTopicName(req.body?.name_fr);
      if (!name_en || !name_fr)
        return res
          .status(400)
          .send("Both English and French topic names are required.");

      const duplicate = await db.instituteTopic.findFirst({
        where: {
          instituteId,
          topic: { name_en, name_fr },
        },
      });
      if (duplicate)
        return res.status(400).send("This topic already exists for the institute.");

      return res.status(200).send(
        await registerInstituteTopic({ institute_id: instituteId, name_en, name_fr })
      );
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).send("Method not allowed.");
  } catch (error: any) {
    return res.status(500).send(error?.message || "Failed to manage topics.");
  }
}
