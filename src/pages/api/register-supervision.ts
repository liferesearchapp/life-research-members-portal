import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import getAccountFromRequest from "../../utils/api/get-account-from-request";

export type RegisterSupervisionParams = {
  last_name: string;
  first_name: string;
  start_date: Date | null;
  end_date: Date | null;
  faculty_id: number | null;
  level_id: number | null;
  note: string | null;
  institute_id: number;
};

export type RegisterSupervisionRes = Awaited<
  ReturnType<typeof registerSupervision>
>;

function registerSupervision(params: RegisterSupervisionParams) {
  return db.supervision.create({
    data: {
      last_name: params.last_name,
      first_name: params.first_name,
      start_date: params.start_date,
      end_date: params.end_date,
      faculty_id: params.faculty_id,
      level_id: params.level_id,
      note: params.note,
      instituteId: params.institute_id,
    },
    select: {
      id: true,
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterSupervisionRes | string>
) {
  const params: RegisterSupervisionParams = req.body;
  const {
    last_name,
    first_name,
    faculty_id,
    level_id,
  } = params;

  if (typeof last_name !== "string") return res.status(400).send("Please provide the last name");
  if (typeof first_name !== "string") return res.status(400).send("Please provide the first name");

  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    if (!currentUser.is_admin)
      return res.status(401).send("You are not authorized to register a supervision");

    const newSupervision = await registerSupervision(params);

    return res.status(200).send(newSupervision);
  } catch (e: any) {
    console.error("Error while registering supervision:", e);
    return res.status(500).send({ ...e, message: "An error occurred while registering the supervision." });
  }
}
