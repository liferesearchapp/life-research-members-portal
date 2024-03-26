import { member } from "@prisma/client";
import db from "../../../prisma/prisma-client";
import getAccountFromRequest from "../../utils/api/get-account-from-request";
import type { NextApiRequest, NextApiResponse } from "next";

export type MemberInstitutesRes = {
  id: number;
  name: string;
  urlIdentifier: string;
  description_en: string | null;
  description_fr: string | null;
};

async function getMemberInstitutes(
  accountId: number
): Promise<MemberInstitutesRes[]> {
  const memberInstitutes = await db.memberInstitute.findMany({
    where: {
      memberId: accountId,
    },
    select: {
      institute: {
        select: {
          id: true,
          name: true,
          urlIdentifier: true,
          description_en: true,
          description_fr: true,
        },
      },
    },
  });

  if (!memberInstitutes) {
    throw new Error("No institutes found for this member.");
  }

  const institutes: MemberInstitutesRes[] = memberInstitutes.map(
    (mi) => mi.institute
  );

  return institutes;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MemberInstitutesRes[] | string>
) {
  try {
    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) {
      return res.status(401).json("Authentication required.");
    }

    const member = await db.member.findFirst({
      where: {
        account_id: currentAccount.id,
      },
    });

    if (!member) {
      return res.status(404).json("Member not found.");
    }

    const institutes = await getMemberInstitutes(member.id);
    return res.status(200).json(institutes);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message });
  }
}
