// See https://learn.microsoft.com/en-us/azure/active-directory/develop/userinfo

import type { NextApiRequest, NextApiResponse } from "next";
import { includeAllAccountInfo } from "../../../prisma/helpers";
import db from "../../../prisma/prisma-client";
import type { AccountDBRes } from "../../pages/api/account/[id]";
import { setRequestActor } from "./audit";

type MsAccountInfo = {
  id: string;
  userPrincipalName: string;
  givenName: string;
  surname: string;
};

function getMicrosoftAccount(authorization: string) {
  return fetch("https://graph.microsoft.com/v1.0/me", { headers: { authorization } });
}

function getAccountFromDatabase(userId: MsAccountInfo): Promise<AccountDBRes> {
  return db.account.findFirst({
    where: {
      OR: [
        { microsoft_id: userId.id },
        { login_email: userId.userPrincipalName.toLocaleLowerCase() },
      ],
    },
    include: includeAllAccountInfo,
  });
}

/**
 * Attempts to retrieve user identification using access token in request header.
 * On a failure, sends the appropriate response and returns null.
 */
export default async function getAccountFromRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AccountDBRes | null> {
  try {
    if (!req.headers.authorization) {
      res.status(401).send("No Authorization Header");
      return null;
    }

    // Attempt to get user id from ms graph
    const msAccountRes = await getMicrosoftAccount(req.headers.authorization);
    if (!msAccountRes.ok) {
      res.status(msAccountRes.status).send(await msAccountRes.text());
      return null;
    }

    // Get registered user in database
    const msAccountInfo: MsAccountInfo = await msAccountRes.json();
    let account = await getAccountFromDatabase(msAccountInfo);
    if (!account) {
      res
        .status(401)
        .send(
          "This account is not registered, please ask an administrator to register the following email: " +
            msAccountInfo.userPrincipalName
        );
      return null;
    }

    // Keep account info synchronized
    if (
      account.microsoft_id !== msAccountInfo.id ||
      account.login_email !== msAccountInfo.userPrincipalName
    ) {
      account = await db.account.update({
        where: { id: account.id },
        data: {
          microsoft_id: msAccountInfo.id,
          login_email: msAccountInfo.userPrincipalName.toLocaleLowerCase(),
        },
        include: includeAllAccountInfo,
      });
    }

    // Tell the audit log who is acting. This is the only place that resolves a token to an
    // account, so it is the only place that can answer it.
    setRequestActor(req, account);

    return account;
  } catch (e: any) {
    console.error({ ...e, message: e.message }); // prisma error messages are getters
    res.status(500).send({ ...e, message: e.message });
    return null;
  }
}
