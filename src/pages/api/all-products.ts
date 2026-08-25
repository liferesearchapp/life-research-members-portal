import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicProductInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import requireInstituteAccess from "../../utils/api/require-institute-access";
import type { PublicProductRes } from "./product/[id]/public";
import methodAllowed from "../../utils/api/method-allowed";

function allProducts(instituteId: number): Promise<PublicProductRes[]> {
  return db.product.findMany({
    where: { institutes: { some: { instituteId } } },
    select: selectPublicProductInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicProductRes[] | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

  const { instituteId } = req.query; // the institute's urlIdentifier
  if (typeof instituteId !== "string")
    return res.status(400).json("Institute identifier must be provided.");

  try {
    const id = await requireInstituteAccess(req, res, instituteId);
    if (id === null) return;
    return res.status(200).send(await allProducts(id));
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}
