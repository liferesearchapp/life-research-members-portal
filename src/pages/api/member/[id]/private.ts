import type { insight } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllMemberInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
  isCurrentMember,
} from "../../../../utils/api/authorization";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";

export type PrivateMemberDBRes = Awaited<ReturnType<typeof getPrivateMemberInfo>>;

// Dates will be stringified when sending response!
export type PrivateMemberRes = Omit<
  NonNullable<PrivateMemberDBRes>,
  "date_joined" | "last_active" | "insight"
> & {
  date_joined: string | null;
  last_active: string | null;
  insight: (Omit<insight, "interview_date"> & { interview_date: string | null }) | null;
};

function getPrivateMemberInfo(id: number) {
  return db.member.findUnique({
    where: { id },
    include: includeAllMemberInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivateMemberDBRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Member ID is required.");

  try {
    const id = parseInt(req.query.id);

    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    const member = await getPrivateMemberInfo(id);
    if (!member) return res.status(400).send("Member not found. ID: " + id);
    if (
      !assertAuthorized(
        res,
        isCurrentMember(currentAccount, id) ||
          hasAnyInstituteAccess(
            currentAccount,
            member.institutes.map((entry) => entry.instituteId)
          ),
        "You are not authorized to view this member's private information."
      )
    )
      return;

    return res.status(200).send(member);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
