import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllProductInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import type { ProductPrivateInfo } from "../../../../services/_types";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import type { PrivateProductDBRes } from "../../product/[id]/private";

export type UpdateProductPrivateParams = {

  peer_reviewed: boolean;
  on_going: boolean;
};

function updateProduct(id: number, params: UpdateProductPrivateParams) {
  let peer_reviewed, on_going;
  if (params.peer_reviewed) peer_reviewed = true;
  else if (!params.peer_reviewed) {
    peer_reviewed = false;
  }
  if (params.on_going) on_going = true;
  else if (!params.on_going) {
    on_going = false;
  }


  return db.product.update({
    where: { id },
    data: {
      peer_reviewed,
      on_going,
    },
    select: selectAllProductInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivateProductDBRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Product ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params = req.body as UpdateProductPrivateParams;

    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    const productInstitutes = await db.productInstitute.findMany({
      where: { productId: id },
      select: {
        instituteId: true,
      },
    });

    //check if user is admin of any product institutes:
    const isUserAdmin = currentUser.instituteAdmin.some((admin) =>
      productInstitutes.some(
        (institute) => institute.instituteId === admin.instituteId
      )
    );

    const isUsersProduct = currentUser.member?.product_member_author.some(
      (product) => product.product_id === id
    );

    const authorized =
      currentUser.is_super_admin || isUserAdmin || isUsersProduct;
    if (!authorized)
      return res.status(401).send("You are not authorized to edit this product information.");

    const updated = await updateProduct(id, params);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
