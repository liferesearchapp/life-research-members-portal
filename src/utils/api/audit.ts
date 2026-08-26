import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";

/**
 * The audit log (issue #16): who did what, when.
 *
 * The abuse this exists to expose is issue #12 -- an institute admin adding a member, using the
 * edit rights that grants, then removing them again. Every step of that is a legitimate-looking
 * request on its own; only the sequence gives it away, and a sequence needs a record.
 *
 * A route opts in by wrapping its handler:
 *
 *     export default withAudit(handler, { action: "update-account/[id]/grant-admin" });
 *
 * `tests/api/route-authorization.test.ts` requires that wrapper on every route that mutates, and
 * on the `private` routes that serve personal data, so this cannot be forgotten on a new route.
 */

/**
 * Who is acting, resolved during authentication.
 *
 * Kept in a WeakMap rather than hung off the request object: no module augmentation of Next's
 * types, and the entry disappears with the request. `getAccountFromRequest` records it, which is
 * the one place that knows the answer, and every authenticated route already goes through it.
 */
type Actor = { id: number; login_email: string };
const actors = new WeakMap<NextApiRequest, Actor>();

export function setRequestActor(req: NextApiRequest, actor: Actor): void {
  actors.set(req, { id: actor.id, login_email: actor.login_email });
}

export function getRequestActor(req: NextApiRequest): Actor | undefined {
  return actors.get(req);
}

/** Extra context a route can attach before it responds. Never put a request body here: PII. */
const details = new WeakMap<NextApiRequest, Record<string, unknown>>();

export function addAuditDetail(req: NextApiRequest, detail: Record<string, unknown>): void {
  details.set(req, { ...details.get(req), ...detail });
}

export type AuditOptions = {
  /** The route pattern, e.g. `update-account/[id]/grant-admin`. Asserted to match the file path. */
  action: string;
};

/** The institute id, when the route was given one that is actually an id. */
function instituteIdFrom(req: NextApiRequest): number | null {
  // `req.query.instituteId` is the institute's urlIdentifier on the list routes, not its id, so
  // it is deliberately not read here -- storing a slug in an int column would be worse than null.
  const fromBody = (req.body as { institute_id?: unknown } | undefined)?.institute_id;
  return typeof fromBody === "number" && Number.isInteger(fromBody) ? fromBody : null;
}

async function record(
  req: NextApiRequest,
  action: string,
  status: number
): Promise<void> {
  try {
    const actor = getRequestActor(req);
    const detail = details.get(req);
    const id = req.query.id;

    await db.auditEvent.create({
      data: {
        actor_account_id: actor?.id ?? null,
        actor_email: actor?.login_email ?? null,
        action,
        target_id: typeof id === "string" ? id : null,
        institute_id: instituteIdFrom(req),
        method: (req.method ?? "GET").toUpperCase(),
        status,
        detail: detail ? JSON.stringify(detail) : null,
      },
    });
  } catch (e) {
    // Fail open: a request that already succeeded is not un-done because the log write failed,
    // and a logging outage must not take the portal down with it. The trade is that a database
    // problem loses events silently apart from this line, so it is loud in the server log.
    //
    // If the log is ever required to be complete rather than best-effort -- a real policy choice,
    // not a technical one -- this is the single place to make it fail closed.
    console.error("[audit] failed to record event", { action, status, error: e });
  }
}

/**
 * Wraps a route handler so that every request through it is recorded: the actor, the route, the
 * `[id]` it addressed, the method, and the status it ended with.
 *
 * Refusals are recorded too. A 401 or 405 is often the more interesting row -- repeated denied
 * attempts are what an audit is looking for -- so the record is written in a `finally`, including
 * when the handler throws.
 */
export default function withAudit(handler: NextApiHandler, { action }: AuditOptions): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } finally {
      // Read the status rather than intercepting `res.status`. Wrapping that method would leave
      // every caller holding a different function than the one on the response -- which quietly
      // breaks any test that asserts on the spy it created, and is a trap for anything else that
      // captures the method. `statusCode` is where Next puts the answer anyway, and Node starts
      // it at 200.
      await record(req, action, res.statusCode ?? 200);
    }
  };
}
