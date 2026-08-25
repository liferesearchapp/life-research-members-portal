import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllSupervisionInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
} from "../../../../utils/api/authorization";
import type { PrivateSupervisionDBRes } from "../../supervision/[id]/private";
import methodAllowed from "../../../../utils/api/method-allowed";

export type UpdateSupervisionPublicParams = {
  last_name: string;
  first_name: string;
  start_date: string | null;
  end_date: string | null;
  faculty_id: number | null;
  level_id: number | null;
  note: string;
  addTraineeMembers: number[];
  deleteTraineeMembers: number[];
  addSupervisorMembers: number[];
  deleteSupervisorMembers: number[];
  addCommitteeMembers: number[];
  deleteCommitteeMembers: number[];
  addCoSupervisorMembers: number[];
  deleteCoSupervisorMembers: number[];
};

function getSupervisionAccessInfo(id: number) {
  return db.supervision.findUnique({
    where: { id },
    select: { id: true, instituteId: true },
  });
}

function updateSupervision(
  id: number,
  params: UpdateSupervisionPublicParams
) {
  return db.supervision.update({
    where: { id },
    data: {
      last_name: params.last_name,
      first_name: params.first_name,
      start_date: params.start_date,
      end_date: params.end_date,
      faculty: params.faculty_id
        ? { connect: { id: params.faculty_id } }
        : params.faculty_id === null
          ? { disconnect: true }
          : undefined,
      level: params.level_id
        ? { connect: { id: params.level_id } }
        : params.level_id === null
          ? { disconnect: true }
          : undefined,
      note: params.note,

      supervision_trainee: {
        deleteMany: params.deleteTraineeMembers.map((id) => ({ member_id: id })),
        createMany: { data: params.addTraineeMembers.map((id) => ({ member_id: id })) },
      },
      supervision_principal_supervisor: {
        deleteMany: params.deleteSupervisorMembers.map((id) => ({ member_id: id })),
        createMany: { data: params.addSupervisorMembers.map((id) => ({ member_id: id })) },
      },
      supervision_committee: {
        deleteMany: params.deleteCommitteeMembers.map((id) => ({ member_id: id })),
        createMany: { data: params.addCommitteeMembers.map((id) => ({ member_id: id })) },
      },
      supervision_co_supervisor: {
        deleteMany: params.deleteCoSupervisorMembers.map((id) => ({ member_id: id })),
        createMany: { data: params.addCoSupervisorMembers.map((id) => ({ member_id: id })) },
      },
    },
    select: selectAllSupervisionInfo,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivateSupervisionDBRes | string>
) {
  if (!methodAllowed(req, res, ["PATCH"])) return;

  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Supervision ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params = req.body as UpdateSupervisionPublicParams;

    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;
    const supervision = await getSupervisionAccessInfo(id);
    if (!supervision)
      return res.status(400).send("Supervision not found. ID: " + id);
    if (
      !assertAuthorized(
        res,
        hasAnyInstituteAccess(currentUser, [supervision.instituteId], {
          allowAdmin: true,
          allowMember: true,
          allowSuperAdmin: true,
        }),
        "You are not authorized to edit this supervision information."
      )
    )
      return;

    const updated = await updateSupervision(id, params);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
