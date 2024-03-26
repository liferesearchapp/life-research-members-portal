import type { product, Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import type { PrivateProductDBRes } from "../product/[id]/private";

async function deleteProduct(productId: number): Promise<product | null> {
  const transaction = await db.$transaction(async (prisma) => {
    // Delete related OrganizationInstitute entries
    await prisma.productInstitute.deleteMany({
      where: { productId: productId },
    });

    // Now safe to delete the organization itself
    return await prisma.product.delete({
      where: { id: productId },
    });
  });

  return transaction;
}

async function isProductMemberAuthor(memberId: number | undefined, productId: number) {
  if (!memberId) return false;
  const productAuthor = await db.product_member_author.findUnique({
    where: {
      member_id_product_id: {
        member_id: memberId,
        product_id: productId,
      },
    },
  });
  return !!productAuthor;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Prisma.PromiseReturnType<typeof deleteProduct> | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Product ID is required.");

  try {
    const id = parseInt(req.query.id);

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    //if (!currentAccount.is_admin && !currentAccount.member)

    if (!(currentAccount.is_admin || await isProductMemberAuthor(currentAccount.member?.id, id))) {
      return res.status(401).send("You are not authorized to delete that product.");
    }

    const product = await deleteProduct(id);

    return res.status(200).send(product);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
