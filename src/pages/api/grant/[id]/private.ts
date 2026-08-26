import type { grant } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllGrantInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
  isGrantParticipant,
} from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import methodAllowed from "../../../../utils/api/method-allowed";
import withAudit from "../../../../utils/api/audit";

export type PrivateGrantDBRes = Awaited<ReturnType<typeof getPrivateGrantInfo>>;

// Dates will be stringified when sending response!
export type PrivateGrantRes = Omit<
  NonNullable<PrivateGrantDBRes>,
  "grant"
> & {

  public: (Omit<grant, "submission_date" | "obtained_date" | "completed_date"> & { submission_date: string | null, obtained_date: string | null, completed_date: string | null }) | null;
};

function getPrivateGrantInfo(id: number) {
  return db.grant.findUnique({
    where: { id },
    select: selectAllGrantInfo,
  });
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivateGrantDBRes | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Grant ID is required.");

  try {

    const id = parseInt(req.query.id);
    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    const grant = await getPrivateGrantInfo(id);
    if (!grant) return res.status(400).send("Grant not found. ID: " + id);

    const authorized =
      hasAnyInstituteAccess(currentAccount, [grant.institute.id]) ||
      isGrantParticipant(currentAccount, [
        ...grant.grant_member_involved.map((entry) => entry.member.id),
        ...grant.grant_investigator_member.map((entry) => entry.member.id),
      ]);
    if (
      !assertAuthorized(
        res,
        authorized,
        "You are not authorized to view this grant's private information."
      )
    )
      return;

    return res.status(200).send(grant);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}

export default withAudit(handler, { action: "grant/[id]/private" });
