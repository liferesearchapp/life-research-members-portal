import type { product } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllProductInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
  isProductAuthor,
} from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import methodAllowed from "../../../../utils/api/method-allowed";
import withAudit from "../../../../utils/api/audit";

export type PrivateProductDBRes = Awaited<ReturnType<typeof getPrivateProductInfo>>;

export type PrivateProductRes = Omit<
  NonNullable<PrivateProductDBRes>,
  "product"
> & {
  public: (Omit<product, "publish_date"> & { publish_date: string | null }) | null;
};

function getPrivateProductInfo(id: number) {
  return db.product.findUnique({
    where: { id },
    select: selectAllProductInfo,
  });
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivateProductDBRes | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Product ID is required.");

  try {
    const id = parseInt(req.query.id);
    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    const product = await getPrivateProductInfo(id);
    if (!product) return res.status(400).send("Product not found. ID: " + id);
    const authorized =
      hasAnyInstituteAccess(
        currentAccount,
        product.institutes.map((entry) => entry.instituteId),
        {
          allowAdmin: true,
          allowMember: true,
          allowSuperAdmin: true,
        }
      ) || isProductAuthor(currentAccount, id);
    if (
      !assertAuthorized(
        res,
        authorized,
        "You are not authorized to view this product's private information."
      )
    )
      return;

    return res.status(200).send(product);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}

export default withAudit(handler, { action: "product/[id]/private" });
