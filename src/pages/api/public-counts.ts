import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import methodAllowed from "../../utils/api/method-allowed";

/**
 * Anonymous, PII-free counts for one institute's landing-page tiles.
 *
 * This exists so `all-members` (and the other list endpoints) no longer have to be exposed
 * without a token just to render "42 members" to logged-out visitors. It returns six integers
 * and nothing else -- no names, no rows, no scalars. Safe to call without authentication.
 */
export type PublicCounts = {
  members: number;
  products: number;
  grants: number;
  events: number;
  supervisions: number;
  partners: number;
};

const ZERO: PublicCounts = {
  members: 0,
  products: 0,
  grants: 0,
  events: 0,
  supervisions: 0,
  partners: 0,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicCounts | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

  const { instituteId } = req.query; // really the urlIdentifier
  if (!instituteId || typeof instituteId !== "string") return res.status(200).json(ZERO);

  try {
    const institute = await db.institute.findUnique({
      where: { urlIdentifier: instituteId },
      select: { id: true },
    });
    if (!institute) return res.status(200).json(ZERO);
    const id = institute.id;

    // Members counts active only, matching the "Active Members" tile; the rest are totals.
    const [members, products, grants, events, supervisions, partners] = await Promise.all([
      db.member.count({ where: { institutes: { some: { instituteId: id } }, is_active: true } }),
      db.product.count({ where: { institutes: { some: { instituteId: id } } } }),
      db.grant.count({ where: { instituteId: id } }),
      db.event.count({ where: { instituteId: id } }),
      db.supervision.count({ where: { instituteId: id } }),
      db.organization.count({ where: { organizationInstitute: { some: { instituteId: id } } } }),
    ]);

    return res.status(200).json({ members, products, grants, events, supervisions, partners });
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
