import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAdminAccess,
} from "../../utils/api/authorization";
import getAccountFromRequest from "../../utils/api/get-account-from-request";
import type { AccountDBRes } from "./account/[id]";

function getAllAccounts(instituteId: number): Promise<AccountDBRes[]> {
  return db.account.findMany({
    where: {
      OR: [
        {
          instituteAdmin: {
            some: {
              instituteId,
            },
          },
        },
        {
          member: {
            is: {
              institutes: {
                some: {
                  instituteId,
                },
              },
            },
          },
        },
      ],
    },
    include: includeAllAccountInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccountDBRes[] | string>
) {
  try {
    if (!req.query.instituteId || typeof req.query.instituteId !== "string")
      return res.status(400).send("Institute ID is required.");

    const instituteId = parseInt(req.query.instituteId);
    if (Number.isNaN(instituteId))
      return res.status(400).send("Institute ID must be a number.");

    const currentUser = await getAccountFromRequest(req, res);

    if (!currentUser) return;
    if (
      !assertAuthorized(
        res,
        currentUser.is_super_admin ||
          hasAnyInstituteAdminAccess(currentUser, [instituteId]),
        "You are not authorized to view account information."
      )
    )
      return;

    const accounts = await getAllAccounts(instituteId);

    return res.status(200).send(accounts);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
