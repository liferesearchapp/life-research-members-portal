import type { event } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllEventInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
} from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";

export type PrivateEventDBRes = Awaited<ReturnType<typeof getPrivateEventInfo>>;

export type PrivateEventRes = Omit<
  NonNullable<PrivateEventDBRes>,
  "event"
> & {
  public: (Omit<event, "start_date" | "end_date"> & { start_date: string | null, end_date: string | null }) | null;
};

function getPrivateEventInfo(id: number) {
  return db.event.findUnique({
    where: { id },
    select: selectAllEventInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivateEventDBRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Event ID is required.");

  try {
    const id = parseInt(req.query.id);
    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    const event = await getPrivateEventInfo(id);
    if (!event) return res.status(400).send("Event not found. ID: " + id);
    if (
      !assertAuthorized(
        res,
        hasAnyInstituteAccess(currentAccount, [event.institute.id]),
        "You are not authorized to view this event's private information."
      )
    )
      return;

    return res.status(200).send(event);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}
