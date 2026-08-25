import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicProductInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import methodAllowed from "../../../../utils/api/method-allowed";

export type PublicProductRes = Awaited<ReturnType<typeof getPublicProductInfo>>;

function getPublicProductInfo(id: number) {
  return db.product.findUnique({
    where: { id },
    select: selectPublicProductInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicProductRes | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Product ID is required.");

  try {
    const id = parseInt(req.query.id);

    const product = await getPublicProductInfo(id);
    if (!product) return res.status(400).send("Product not found. ID: " + id);

    return res.status(200).send(product);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
