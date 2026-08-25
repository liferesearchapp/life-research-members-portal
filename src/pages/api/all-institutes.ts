import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllInstituteInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import {
  assertAuthorized,
  getVisibleInstituteIds,
} from "../../utils/api/authorization";
import getAccountFromRequest from "../../utils/api/get-account-from-request";
import type { InstituteInfo } from "../../services/_types";
import methodAllowed from "../../utils/api/method-allowed";

function getAllInstitutesForUser(
  currentUser: Awaited<ReturnType<typeof getAccountFromRequest>>
) {
  if (!currentUser) return [];

  if (currentUser.is_super_admin) {
    return db.institute.findMany({ select: selectAllInstituteInfo });
  }

  const visibleInstituteIds = Array.from(getVisibleInstituteIds(currentUser));

  return db.institute.findMany({
    where: { id: { in: visibleInstituteIds } },
    select: selectAllInstituteInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InstituteInfo[] | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;
    if (
      !assertAuthorized(
        res,
        currentUser.is_super_admin || getVisibleInstituteIds(currentUser).size > 0,
        "You are not authorized to view institute information."
      )
    )
      return;

    const institutes = await getAllInstitutesForUser(currentUser);
    return res.status(200).send(institutes);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
