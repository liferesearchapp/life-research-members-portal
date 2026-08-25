import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import { assertAuthorized, hasAnyInstituteAccess } from "./authorization";
import getAccountFromRequest from "./get-account-from-request";

/**
 * Authenticates and authorizes a caller for a public, institute-scoped list endpoint
 * (`/api/all-members`, `/api/all-products`, …).
 *
 * These endpoints take an institute's `urlIdentifier` from the query string. That identifier is a
 * *request*, never permission: the caller must be authenticated, and must administer or belong to
 * that institute (super admins pass). Authentication happens before the institute is resolved, so
 * an anonymous caller cannot use the endpoint to probe which identifiers exist.
 *
 * On success returns the institute's numeric id. On any failure it sends the response and returns
 * `null` — mirroring `getAccountFromRequest`'s contract, so callers just `if (id === null) return;`.
 */
export default async function requireInstituteAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  urlIdentifier: string
): Promise<number | null> {
  const account = await getAccountFromRequest(req, res);
  if (!account) return null;

  const institute = await db.institute.findUnique({
    where: { urlIdentifier },
    select: { id: true },
  });
  if (!institute) {
    res.status(404).send("Institute not found.");
    return null;
  }

  if (
    !assertAuthorized(
      res,
      hasAnyInstituteAccess(account, [institute.id], {
        allowAdmin: true,
        allowMember: true,
        allowSuperAdmin: true,
      }),
      "You are not authorized to view this institute's data."
    )
  )
    return null;

  return institute.id;
}
