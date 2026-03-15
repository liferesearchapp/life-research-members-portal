import { type account, Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import getAccountFromRequest from "../../utils/api/get-account-from-request";


export type RegisterAccountParams = {
  login_email: string;
  first_name: string;
  last_name: string;
  is_admin?: boolean;
  is_member?: boolean;
};
export type RegisterAccountRes = Awaited<ReturnType<typeof registerAccount>>;

function registerAccount(params: RegisterAccountParams) {
  return db.account.create({
    data: {
      login_email: params.login_email.toLocaleLowerCase(),
      is_admin: params.is_admin,
      first_name: params.first_name,
      last_name: params.last_name,
      member: params.is_member ? { create: { date_joined: new Date() } } : undefined,
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterAccountRes | string>
) {
  const params: RegisterAccountParams = req.body;
  const { login_email, first_name, last_name, is_admin } = params;
  if (typeof login_email !== "string") return res.status(400).send("Email is required.");
  if (typeof first_name !== "string") return res.status(400).send("First Name is required.");
  if (typeof last_name !== "string") return res.status(400).send("Last Name is required.");
  if (!["boolean", "undefined"].includes(typeof is_admin))
    return res.status(400).send("is_admin may only be boolean or undefined.");

  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    if (!currentUser.is_admin)
      return res.status(401).send("You are not authorized to register accounts.");

    const newUser = await registerAccount(params);

    return res.status(200).send(newUser);
  } catch (e: any) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return res.status(400).send("This email is already registered: " + login_email);

    return res.status(500).send({ ...e, message: e.message }); // prisma error messages are getters
  }
}
