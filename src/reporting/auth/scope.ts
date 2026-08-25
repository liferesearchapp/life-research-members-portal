import type { NextApiRequest, NextApiResponse } from "next";
import getAccountFromRequest from "../../utils/api/get-account-from-request";

/**
 * Reporting authorization.
 *
 * The rest of `src/pages/api` authenticates (via getAccountFromRequest) but then only checks
 * that the caller is *some* registered account. Reporting must not follow that pattern: every
 * reporting read is authorized against the caller's session, and the institute named in a URL
 * is treated as a *request* that must be checked, never as permission.
 */

export type ReportingScope =
  | { kind: "institute"; accountId: number; instituteId: number; urlIdentifier: string }
  | { kind: "super"; accountId: number };

/**
 * Whether a super admin may read an institute's member-level reports.
 *
 * Default false: super admins administer RIMS instances and get the cross-institute usage
 * portal, which reports on activity and aggregates rather than on people. Letting that role
 * also read every institute's member-level data would make it a de-facto global reader of
 * personal information, which is the thing this design is trying to avoid.
 *
 * Flip to true if super admins are meant to be able to support/debug an institute's own reports.
 */
export const SUPER_ADMIN_CAN_READ_INSTITUTE_REPORTS = false;

/**
 * Authorizes a request to read reports for the institute identified by `urlIdentifier`.
 * On failure, sends the response and returns null (matching getAccountFromRequest's contract).
 */
export async function requireInstituteReportingScope(
  req: NextApiRequest,
  res: NextApiResponse,
  urlIdentifier: string
): Promise<ReportingScope | null> {
  const account = await getAccountFromRequest(req, res);
  if (!account) return null;

  // The URL names the institute; the session decides whether it may be read.
  const adminOf = account.instituteAdmin.find(
    (a) => a.institute.urlIdentifier === urlIdentifier
  );

  if (adminOf) {
    return {
      kind: "institute",
      accountId: account.id,
      instituteId: adminOf.instituteId,
      urlIdentifier,
    };
  }

  if (account.is_super_admin && SUPER_ADMIN_CAN_READ_INSTITUTE_REPORTS) {
    const institute = await resolveInstituteId(urlIdentifier);
    if (!institute) {
      res.status(404).send("Institute not found.");
      return null;
    }
    return { kind: "institute", accountId: account.id, instituteId: institute, urlIdentifier };
  }

  // Deliberately identical response whether the institute is absent or merely forbidden, so
  // this endpoint cannot be used to enumerate which institutes exist.
  res.status(403).send("You are not an administrator of this institute.");
  return null;
}

/**
 * Authorizes a request to read the cross-institute (RIMS administrator) reports.
 */
export async function requireSuperReportingScope(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<ReportingScope | null> {
  const account = await getAccountFromRequest(req, res);
  if (!account) return null;

  if (!account.is_super_admin) {
    res.status(403).send("Super administrator access is required.");
    return null;
  }

  return { kind: "super", accountId: account.id };
}

async function resolveInstituteId(urlIdentifier: string): Promise<number | null> {
  const db = (await import("../../../prisma/prisma-client")).default;
  const institute = await db.institute.findUnique({
    where: { urlIdentifier },
    select: { id: true },
  });
  return institute?.id ?? null;
}
