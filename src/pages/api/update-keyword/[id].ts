import type { keyword } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../../prisma/prisma-client";
import type { KeywordInfo } from "../../../services/_types";
import {
  assertAuthorized,
  hasAdministrativeRole,
} from "../../../utils/api/authorization";
import getAccountFromRequest from "../../../utils/api/get-account-from-request";
import methodAllowed from "../../../utils/api/method-allowed";

function updateKeyword(id: number, { name_en, name_fr }: KeywordInfo): Promise<keyword> {
  return db.keyword.update({ where: { id }, data: { name_en, name_fr } });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<keyword | string>) {
  if (!methodAllowed(req, res, ["PATCH"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Keyword ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params = req.body as KeywordInfo;

    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;
    if (
      !assertAuthorized(
        res,
        hasAdministrativeRole(currentUser) || !!currentUser.member,
        "You are not authorized to edit keywords."
      )
    )
      return;

    const updated = await updateKeyword(id, params);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
