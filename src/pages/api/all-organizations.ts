import type { organization } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import getAccountFromRequest from "../../utils/api/get-account-from-request";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<organization[] | string>
) {
  try {
    // Cross-institute helper list (organization picker for forms), so it is intentionally not
    // scoped to one institute -- but it must not be anonymous. Any registered account may read
    // it; it carries no personal data, only organization names/scopes/types.
    const account = await getAccountFromRequest(req, res);
    if (!account) return;

    const organizations = await db.organization.findMany();
    return res.status(200).send(organizations);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
