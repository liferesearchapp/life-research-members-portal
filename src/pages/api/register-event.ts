import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
} from "../../utils/api/authorization";
import getAccountFromRequest from "../../utils/api/get-account-from-request";
import methodAllowed from "../../utils/api/method-allowed";
import withAudit from "../../utils/api/audit";

export type RegisterEventParams = {
  name_en: string;
  name_fr: string;
  start_date: Date | null;
  end_date: Date | null;
  event_type_id: number | null;
  note: string | null;
  institute_id: number;
};

export type RegisterEventRes = Awaited<ReturnType<typeof registerEvent>>;

function registerEvent(params: RegisterEventParams) {
  return db.event.create({
    data: {
      name_en: params.name_en,
      name_fr: params.name_fr,
      start_date: params.start_date,
      end_date: params.end_date,
      event_type_id: params.event_type_id,
      note: params.note,
      instituteId: params.institute_id,
    },
    select: {
      id: true,
    },
  });
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterEventRes | string>
) {
  if (!methodAllowed(req, res, ["PUT"])) return;

  const params: RegisterEventParams = req.body;
  const {
    name_en,
    name_fr,
    start_date,
    end_date,
    event_type_id,
    note,
  } = params;

  if (typeof name_en !== "string") return res.status(400).send("Please provide the name_en");
  if (typeof name_fr !== "string") return res.status(400).send("Please provide the name_fr");

  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;
    if (
      !assertAuthorized(
        res,
        hasAnyInstituteAccess(currentUser, [params.institute_id]),
        "You are not authorized to register an event."
      )
    )
      return;

    const newEvent = await registerEvent(params);

    return res.status(200).send(newEvent);
  } catch (e: any) {
    console.error("Error while registering event:", e);
    return res.status(500).send({ ...e, message: "An error occurred while registering the event." });
  }
}

export default withAudit(handler, { action: "register-event" });
