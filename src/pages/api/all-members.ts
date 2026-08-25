import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicMemberInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
} from "../../utils/api/authorization";
import getAccountFromRequest from "../../utils/api/get-account-from-request";
import type { PublicMemberRes } from "./member/[id]/public";

function allMembers(instituteId: number): Promise<PublicMemberRes[]> {
  return db.member.findMany({
    where: { institutes: { some: { instituteId } } },
    select: selectPublicMemberInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicMemberRes[] | string>
) {
  // Despite the parameter name, this is the institute's urlIdentifier.
  const { instituteId } = req.query;
  if (!instituteId || typeof instituteId !== "string")
    return res.status(400).json("Please select an Institute.");

  try {
    // Authenticate FIRST, before resolving the institute -- so an anonymous caller always gets
    // 401 and cannot use this endpoint to probe which urlIdentifiers exist.
    const currentAccount = await getAccountFromRequest(req, res);
    if (!currentAccount) return;

    const institute = await db.institute.findUnique({
      where: { urlIdentifier: instituteId },
      select: { id: true },
    });
    if (!institute) return res.status(404).send("Institute not found.");

    // The urlIdentifier in the query is a request, not permission: the caller must administer or
    // belong to THIS institute (super admins pass). Members need the roster for the members page.
    if (
      !assertAuthorized(
        res,
        hasAnyInstituteAccess(currentAccount, [institute.id], {
          allowAdmin: true,
          allowMember: true,
          allowSuperAdmin: true,
        }),
        "You are not authorized to view this institute's members."
      )
    )
      return;

    return res.status(200).send(await allMembers(institute.id));
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
