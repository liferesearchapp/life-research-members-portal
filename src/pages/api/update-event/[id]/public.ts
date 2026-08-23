import type { NextApiRequest, NextApiResponse } from "next";
import { selectAllEventInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import getAccountFromRequest from "../../../../utils/api/get-account-from-request";
import {
  assertAuthorized,
  hasAnyInstituteAccess,
} from "../../../../utils/api/authorization";
import type { PrivateEventDBRes } from "../../event/[id]/private";

export type UpdateEventPublicParams = {

  name_en: string;
  name_fr: string;
  start_date: string | null;
  end_date: string | null;
  event_type_id: number | null;
  note: string;
  addTopics: number[];
  deleteTopics: number[];
  addMembers: number[];
  deleteMembers: number[];
  addPartners: number[];
  deletePartners: number[];
  addProducts: number[];
  deleteProducts: number[];
  deleteGrants: number[];
  addGrants: number[];
  addPreviousEvents: number[];
  deletePreviousEvents: number[];
  addNextEvents: number[];
  deleteNextEvents: number[];

};

function getEventAccessInfo(id: number) {
  return db.event.findUnique({
    where: { id },
    select: { id: true, instituteId: true },
  });
}

function updateEvent(
  id: number,
  {

    name_en,
    name_fr,
    start_date,
    end_date,
    event_type_id,
    note,
    addTopics,
    deleteTopics,
    addMembers,
    deleteMembers,
    addPartners,
    deletePartners,
    addProducts,
    deleteProducts,
    deleteGrants,
    addGrants,
    addPreviousEvents,
    deletePreviousEvents,
    addNextEvents,
    deleteNextEvents,
  }: UpdateEventPublicParams
) {
  return db.event.update({
    where: { id },
    data: {
      name_en,
      name_fr,
      start_date,
      end_date,
      event_type: event_type_id
        ? { connect: { id: event_type_id } }
        : event_type_id === null
          ? { disconnect: true }
          : undefined,
      note,
      event_topic: {
        deleteMany: deleteTopics.map((id) => ({ topic_id: id })),
        createMany: { data: addTopics.map((id) => ({ topic_id: id })) },
      },
      event_member_involved: {
        deleteMany: deleteMembers.map((id) => ({ member_id: id })),
        createMany: { data: addMembers.map((id) => ({ member_id: id })) },
      },
      event_partner_involved: {
        deleteMany: deletePartners.map((id) => ({ organization_id: id })),
        createMany: { data: addPartners.map((id) => ({ organization_id: id })) },
      },
      event_product_resulted: {
        deleteMany: deleteProducts.map((id) => ({ product_id: id })),
        createMany: { data: addProducts.map((id) => ({ product_id: id })) },
      },
      event_grant_resulted: {
        deleteMany: deleteGrants.map((id) => ({ grant_id: id })),
        createMany: { data: addGrants.map((id) => ({ grant_id: id })) },
      },
      event_previous_event_event_previous_event_event_idToevent: {
        deleteMany: deletePreviousEvents.map((previous_event_id) => ({ previous_event_id })),
        createMany: { data: addPreviousEvents.map((previous_event_id) => ({ previous_event_id })) },

      },
      event_next_event_event_next_event_event_idToevent: {
        deleteMany: deleteNextEvents.map((next_event_id) => ({ next_event_id })),
        createMany: { data: addNextEvents.map((next_event_id) => ({ next_event_id })) },
      },
    },

    select: selectAllEventInfo,
  }).then(async (updatedEvent) => {
    // Ensure previous events have their next event updated
    await Promise.all(
      addPreviousEvents.map((previous_event_id) =>
        db.event.update({
          where: { id: previous_event_id },
          data: {
            event_next_event_event_next_event_event_idToevent: {
              create: { next_event_id: id },
            },
          },
        })
      )
    );

    // Ensure next events have their previous event updated
    await Promise.all(
      addNextEvents.map((next_event_id) =>
        db.event.update({
          where: { id: next_event_id },
          data: {
            event_previous_event_event_previous_event_event_idToevent: {
              create: { previous_event_id: id },
            },
          },
        })
      )
    );


    // Ensure next events have their previous event deleted
    await Promise.all(
      deleteNextEvents.map((next_event_id) =>
        db.event.update({
          where: { id: next_event_id },
          data: {
            event_previous_event_event_previous_event_event_idToevent: {
              deleteMany: { previous_event_id: id },
            },
          },
        })
      )
    );
    // Ensure previous events have their next event deleted

    await Promise.all(
      deletePreviousEvents.map((previous_event_id) =>
        db.event.update({
          where: { id: previous_event_id },
          data: {
            event_next_event_event_next_event_event_idToevent: {
              deleteMany: { next_event_id: id },
            },
          },
        })
      )
    );


    return updatedEvent;
  });
};



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrivateEventDBRes | string>
) {
  if (!req.query.id || typeof req.query.id !== "string")
    return res.status(400).send("Event ID is required.");

  try {
    const id = parseInt(req.query.id);
    const params = req.body as UpdateEventPublicParams;

    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;
    const event = await getEventAccessInfo(id);
    if (!event) return res.status(400).send("Event not found. ID: " + id);
    if (
      !assertAuthorized(
        res,
        hasAnyInstituteAccess(currentUser, [event.instituteId]),
        "You are not authorized to edit this event information."
      )
    )
      return;

    const updated = await updateEvent(id, params);

    return res.status(200).send(updated);
  } catch (e: any) {
    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
