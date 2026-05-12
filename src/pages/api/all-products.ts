import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicProductInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import type { PublicProductRes } from "./product/[id]/public";

async function allProducts(urlIdentifier: string): Promise<PublicProductRes[]> {
  const institute = await db.institute.findUnique({
    where: {
      urlIdentifier: urlIdentifier,
    },
    select: {
      id: true,
    },
  });

  if (!institute) throw new Error("Institute not found.");

  return db.product.findMany({
    where: {
      institutes: {
        some: {
          instituteId: institute.id,
        },
      },
    },
    select: selectPublicProductInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicProductRes[] | string>
) {
  const { instituteId } = req.query;

  if (typeof instituteId !== "string") {
    return res.status(400).json("Institute identifier must be provided.");
  }

  try {
    const products = await allProducts(instituteId);
    return res.status(200).send(products);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}
