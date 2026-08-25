import type { product } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import getAccountFromRequest from "../../utils/api/get-account-from-request";

export type ProductTitle = Pick<product, "id" | "title_en" | "title_fr">;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProductTitle[] | string>
) {
  try {
    // Cross-institute helper (title lookup / duplicate check), so not institute-scoped -- but no
    // longer anonymous. Also narrowed to id + titles: the previous `findMany()` returned every
    // product scalar (note, doi, dates) across all tenants, which a "titles" endpoint should not.
    const account = await getAccountFromRequest(req, res);
    if (!account) return;

    const titles = await db.product.findMany({
      select: { id: true, title_en: true, title_fr: true },
    });
    return res.status(200).send(titles);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
