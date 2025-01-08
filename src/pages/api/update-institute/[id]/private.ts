import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllInstituteInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import type { InstituteInfo } from "../../../../services/_types";

export type UpdateInstituteParams = {
  name: string;
  urlIdentifier: string;
  description_en?: string | null;
  description_fr?: string | null;
  is_active: boolean;
};

function updateInstitute( id: number, params: UpdateInstituteParams) {
  return db.institute.update({
    where: { id },
    data: {
        name: params.name,
        urlIdentifier: params.urlIdentifier,
        description_en: params.description_en,
        description_fr: params.description_fr,
        is_active: params.is_active,
    },

    select: selectAllInstituteInfo,
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InstituteInfo | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Institute ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params = req.body as UpdateInstituteParams;

    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;
    
    const authorized = currentUser.is_super_admin;

    if (!authorized)
      return res
        .status(401)
        .send("You are not authorized to update that institute.");

    const updated = await updateInstitute(id, params);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
