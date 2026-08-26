import type { supervision } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllSupervisionInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
  isPrincipalSupervisor,
} from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import methodAllowed from "../../../../utils/api/method-allowed";
import withAudit from "../../../../utils/api/audit";

export type PrivateSupervisionDBRes = Awaited<ReturnType<typeof getPrivateSupervisionInfo>>;

export type PrivateSupervisionRes = Omit<
  NonNullable<PrivateSupervisionDBRes>,
  "supervision"
> & {
  public: (Omit<supervision, "start_date" | "end_date"> & { start_date: string | null, end_date: string | null }) | null;
};

function getPrivateSupervisionInfo(id: number) {
  return db.supervision.findUnique({
    where: { id },
    select: selectAllSupervisionInfo,
  });
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivateSupervisionDBRes | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Supervision ID is required.");

  try {
    const id = parseInt(req.query.id);
    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    const supervision = await getPrivateSupervisionInfo(id);
    if (!supervision) return res.status(400).send("Supervision not found. ID: " + id);
    if (
      !assertAuthorized(
        res,
        hasAnyInstituteAccess(currentAccount, [supervision.institute.id], {
          allowAdmin: true,
          allowMember: true,
          allowSuperAdmin: true,
        }) || isPrincipalSupervisor(currentAccount, id),
        "You are not authorized to view this supervision's private information."
      )
    )
      return;

    return res.status(200).send(supervision);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}

export default withAudit(handler, { action: "supervision/[id]/private" });
