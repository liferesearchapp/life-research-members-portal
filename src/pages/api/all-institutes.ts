import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import getAccountFromRequest from "../../utils/api/get-account-from-request";
import type { AccountDBRes } from "./account/[id]";
import type { institute } from "@prisma/client";

function getAllInstitutes() {
  return db.institute.findMany();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<institute[] | string>
) {
  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    const institutes = await getAllInstitutes();
    return res.status(200).send(institutes);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
