import type { NextApiRequest, NextApiResponse } from "next";
import { selectPublicSupervisionInfo } from "../../../../../prisma/helpers";
import db from "../../../../../prisma/prisma-client";
import methodAllowed from "../../../../utils/api/method-allowed";

export type PublicSupervisionRes = Awaited<ReturnType<typeof getPublicSupervisionInfo>>;

function getPublicSupervisionInfo(id: number) {
    return db.supervision.findUnique({
        where: { id },
        select: selectPublicSupervisionInfo,
    });
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<PublicSupervisionRes | string>
) {
  if (!methodAllowed(req, res, ["GET"])) return;

    if (!req.query.id || typeof req.query.id !== "string")
        return res.status(400).send("Supervision ID is required.");

    try {
        const id = parseInt(req.query.id);
        const supervision = await getPublicSupervisionInfo(id);
        if (!supervision) return res.status(400).send("Supervision not found. ID: " + id);

        return res.status(200).send(supervision);
    } catch (e: any) {
        return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
    }
}