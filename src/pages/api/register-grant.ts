import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import getAccountFromRequest from "../../utils/api/get-account-from-request";
import isAuthorMatch from "../../components/products/author-match"; // Import isAuthorMatch
import removeDiacritics from "../../utils/front-end/remove-diacritics"; // Import removeDiacritics

export type RegisterGrantParams = {
  title: string;
  amount: number;
  throught_lri: boolean;
  status_id: number;
  submission_date: Date | null;
  obtained_date: Date | null;
  completed_date: Date | null;
  source_id: number;
  all_investigator: string;
  topic_id: number;
  note: string;
  institute_id: number;
};

export type RegisterGrantRes = Awaited<ReturnType<typeof registerGrant>>;

function registerGrant(params: RegisterGrantParams) {
  return db.grant.create({
    data: {
      title: params.title,
      amount: params.amount,
      throught_lri: params.throught_lri,
      status_id: params.status_id,
      submission_date: params.submission_date,
      obtained_date: params.obtained_date,
      completed_date: params.completed_date,
      source_id: params.source_id,
      all_investigator: params.all_investigator,
      topic_id: params.topic_id,
      note: params.note,
      instituteId: params.institute_id,
    },
    select: {
      id: true,
    },
  });
}

// Add this function to fetch members
async function fetchMembers() {
  return db.member.findMany({
    include: {
      account: true,
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterGrantRes | string>
) {
  const params: RegisterGrantParams = req.body;
  const {
    title,
    amount,
    throught_lri,
    status_id,
    source_id,
    all_investigator,
  } = params;

  if (typeof title !== "string") return res.status(400).send("Please provide the title");
  if (isNaN(amount)) return res.status(400).send("Amount is required.");
  if (typeof throught_lri !== "boolean") return res.status(400).send("Throught LRI is required.");
  if (isNaN(status_id)) return res.status(400).send("Status ID is required.");
  if (isNaN(source_id)) return res.status(400).send("Source ID is required.");
  if (typeof all_investigator !== "string") return res.status(400).send("All investigator is required.");

  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    if (!currentUser.is_admin)
      return res.status(401).send("You are not authorized to register a grant");

    const newGrant = await registerGrant(params);

    // Get the matched investigators
    const members = await fetchMembers();

    const investigators = all_investigator.split(/[,;&]/).map((investigator) => investigator.trim());
    const matchedInvestigators = Array.from(
      new Set(
        investigators
          .map((investigator) => {
            const foundAccount = members.find((member) =>
              member &&
              member.account &&
              member.account.first_name &&
              member.account.last_name &&
              isAuthorMatch(
                removeDiacritics(investigator),
                member.account.first_name,
                member.account.last_name
              )
            );

            return foundAccount ? foundAccount.id : null;
          })
          .filter((investigatorId) => investigatorId !== null)
          .map((investigatorId) => investigatorId as number)
      )
    );

    // Insert matched investigators into the grant_member_involved table
    await Promise.all(
      matchedInvestigators.map((investigatorId) =>
        db.grant_member_involved.create({
          data: {
            member_id: investigatorId,
            grant_id: newGrant.id,
          },
        })
      )
    );

    return res.status(200).send(newGrant);
  } catch (e: any) {
    console.error("Error while registering grant:", e);
    return res.status(500).send({ ...e, message: "An error occurred while registering the grant." });
  }
}
