import type { topic } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
} from "../../../utils/api/authorization";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";

export type UpdateInstituteTopicParams = {
  institute_id: number;
  name_en: string;
  name_fr: string;
  is_active: boolean;
};

type UpdateInstituteTopicRes = topic & { is_active: boolean };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateInstituteTopicRes | string>
) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).send("Method not allowed.");
  }

  const topicId = Number(req.query.id);
  const instituteId = Number(req.body?.institute_id);
  const name_en =
    typeof req.body?.name_en === "string" ? req.body.name_en.trim() : "";
  const name_fr =
    typeof req.body?.name_fr === "string" ? req.body.name_fr.trim() : "";
  const is_active = req.body?.is_active;

  if (!Number.isInteger(topicId) || topicId <= 0)
    return res.status(400).send("A valid topic ID is required.");
  if (!Number.isInteger(instituteId) || instituteId <= 0)
    return res.status(400).send("A valid institute ID is required.");
  if (!name_en || !name_fr)
    return res
      .status(400)
      .send("Both English and French topic names are required.");
  if (typeof is_active !== "boolean")
    return res.status(400).send("Topic status is required.");

  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;
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
      return;

    const mapping = await db.instituteTopic.findUnique({
      where: {
        instituteId_topicId: { instituteId, topicId },
      },
    });
    if (!mapping)
      return res.status(404).send("Topic not found for this institute.");

    const updated = await db.$transaction(async (transaction) => {
      const updatedTopic = await transaction.topic.update({
        where: { id: topicId },
        data: { name_en, name_fr },
      });
      const updatedMapping = await transaction.instituteTopic.update({
        where: { instituteId_topicId: { instituteId, topicId } },
        data: { is_active },
      });
      return { ...updatedTopic, is_active: updatedMapping.is_active };
    });

    return res.status(200).send(updated);
  } catch (error: any) {
    return res.status(500).send(error?.message || "Failed to update topic.");
  }
}
