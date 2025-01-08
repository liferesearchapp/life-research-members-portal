import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllProductInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import type { PrivateProductDBRes } from "../../product/[id]/private";

export type UpdateProductPublicParams = {
  title_en: string;
  title_fr: string;
  publish_date?: string | null;
  all_author?: string;
  doi?: string;
  product_type_id?: number | null;
  note?: string;
  institutes?: number[];
  deleteTargets?: number[];
  addTargets?: number[];
  deletePartners?: number[];
  addPartners?: number[];
  addMembers?: number[];
  deleteMembers?: number[];
};

async function updateProduct(
  id: number,
  {
    title_en,
    title_fr,
    publish_date,
    all_author,
    doi,
    product_type_id,
    note,
    institutes = [],
    deleteTargets = [],
    addTargets = [],
    deletePartners = [],
    addPartners = [],
    addMembers = [],
    deleteMembers = [],
  }: UpdateProductPublicParams
) {
  await db.productInstitute.deleteMany({
    where: { productId: id },
  });

  await db.productInstitute.createMany({
    data: institutes.map((instituteId) => ({
      instituteId,
      productId: id,
    })),
  });

  return db.product.update({
    where: { id },
    data: {
      title_en,
      title_fr,
      publish_date,
      all_author,
      doi,
      note,
      product_type: product_type_id
        ? { connect: { id: product_type_id } }
        : product_type_id === null
        ? { disconnect: true }
        : undefined,
      product_target: {
        deleteMany: deleteTargets.map((id) => ({ target_id: id })),
        createMany: { data: addTargets.map((id) => ({ target_id: id })) },
      },
      product_partnership: {
        deleteMany: deletePartners.map((id) => ({ organization_id: id })),
        createMany: {
          data: addPartners.map((id) => ({ organization_id: id })),
        },
      },
      product_member_author: {
        deleteMany: deleteMembers.map((id) => ({ member_id: id })),
        createMany: { data: addMembers.map((id) => ({ member_id: id })) },
      },
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
    const params = req.body as UpdateProductPublicParams;

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
      return res
        .status(401)
        .send("You are not authorized to edit this product information.");


    const updated = await updateProduct(id, params);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
