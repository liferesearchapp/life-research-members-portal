import type { NextApiRequest, NextApiResponse } from "next";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Gates a route to the HTTP methods it actually implements.
 *
 * Next.js routes a request to a handler by path alone, so without this every handler runs on
 * every verb: `GET /api/delete-account/5` deletes the account. Authentication is a bearer token
 * in the Authorization header, so that is not reachable cross-origin the way a cookie session
 * would be -- but a client that sends the wrong verb still succeeds silently instead of failing
 * loudly, anything that treats GET as safe (prefetch, speculative navigation, retries) can drive
 * a write, and the day this app gains a cookie session or a credential-forwarding gateway, every
 * ungated route becomes a CSRF target at once.
 *
 * Returns true when the request may proceed. On refusal it has already sent 405 with an `Allow`
 * header, so the caller returns without touching the database:
 *
 *     if (!methodAllowed(req, res, ["GET"])) return;
 *
 * HEAD is accepted wherever GET is: it is defined as GET without a response body, and Next runs
 * the same handler for it.
 */
export default function methodAllowed(
  req: NextApiRequest,
  res: NextApiResponse,
  allowed: HttpMethod[]
): boolean {
  const method = (req.method ?? "GET").toUpperCase();

  if (allowed.includes(method as HttpMethod)) return true;
  if (method === "HEAD" && allowed.includes("GET")) return true;

  res.setHeader("Allow", allowed.join(", "));
  res.status(405).send(`Method ${method} is not allowed on this endpoint.`);
  return false;
}
