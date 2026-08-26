import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllProductInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import {
  assertAuthorized,
  hasAllInstituteAccess,
  hasAnyInstituteAccess,
  isProductAuthor,
} from "../../../../utils/api/authorization";
import type { PrivateProductDBRes } from "../../product/[id]/private";
import methodAllowed from "../../../../utils/api/method-allowed";

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

function getNormalizedInstituteIds(instituteIds: Iterable<number | null | undefined>) {
  return Array.from(
    new Set(
      Array.from(instituteIds).filter(
        (instituteId): instituteId is number =>
          typeof instituteId === "number" && Number.isFinite(instituteId)
      )
    )
  ).sort((a, b) => a - b);
}

function haveSameInstituteIds(
  currentInstituteIds: Iterable<number | null | undefined>,
  nextInstituteIds: Iterable<number | null | undefined>
) {
  const current = getNormalizedInstituteIds(currentInstituteIds);
  const next = getNormalizedInstituteIds(nextInstituteIds);

  if (current.length !== next.length) return false;

  return current.every((instituteId, index) => instituteId === next[index]);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivateProductDBRes | string>
) {
  if (!methodAllowed(req, res, ["PATCH"])) return;

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
    const currentInstituteIds = productInstitutes.map(
      (institute) => institute.instituteId
    );

    if (
      !assertAuthorized(
        res,
        hasAnyInstituteAccess(currentUser, currentInstituteIds, {
          allowAdmin: true,
          allowMember: true,
          allowSuperAdmin: true,
        }) || isProductAuthor(currentUser, id),
        "You are not authorized to edit this product information."
      )
    )
      return;
    if (
      !haveSameInstituteIds(currentInstituteIds, params.institutes ?? []) &&
      !assertAuthorized(
        res,
        hasAllInstituteAccess(currentUser, params.institutes ?? [], {
          allowAdmin: true,
          allowMember: true,
          allowSuperAdmin: true,
        }),
        "You are not authorized to assign this product to the selected institutes."
      )
    )
      return;

    const updated = await updateProduct(id, params);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
