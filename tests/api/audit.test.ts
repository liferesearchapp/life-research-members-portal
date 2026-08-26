import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("../../prisma/prisma-client", () => ({
  default: { auditEvent: { create: mocks.create } },
}));

import withAudit, { addAuditDetail, setRequestActor } from "../../src/utils/api/audit";

function request(over: Partial<NextApiRequest> = {}) {
  return {
    method: "PATCH",
    query: {},
    headers: {},
    ...over,
  } as unknown as NextApiRequest;
}

/** Mirrors what Next does: `status(code)` sets `statusCode`, which is what withAudit reads. */
function response() {
  const res = { statusCode: 200, send: vi.fn(), setHeader: vi.fn(), status: vi.fn() };
  res.send.mockReturnValue(res);
  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  return res as unknown as NextApiResponse & { statusCode: number };
}

/** The row withAudit tried to write. */
const written = () => mocks.create.mock.calls[0][0].data;

describe("withAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue({});
  });

  it("records the action, method and status of a request", async () => {
    const handler = vi.fn(async (_req: NextApiRequest, res: NextApiResponse) => {
      res.status(200).send("ok");
    });
    const req = request({ method: "PATCH", query: { id: "42" } } as Partial<NextApiRequest>);

    await withAudit(handler, { action: "update-account/[id]/grant-admin" })(req, response());

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(written()).toMatchObject({
      action: "update-account/[id]/grant-admin",
      method: "PATCH",
      status: 200,
      target_id: "42",
    });
  });

  it("records who did it, once authentication has identified them", async () => {
    const req = request();
    const handler = vi.fn(async (r: NextApiRequest, res: NextApiResponse) => {
      // This is what getAccountFromRequest does on a successful authentication.
      setRequestActor(r, { id: 9, login_email: "admin@example.invalid" });
      res.status(200).send("ok");
    });

    await withAudit(handler, { action: "x" })(req, response());

    expect(written()).toMatchObject({
      actor_account_id: 9,
      actor_email: "admin@example.invalid",
    });
  });

  it("records an unauthenticated attempt with a null actor rather than dropping it", async () => {
    const handler = vi.fn(async (_req: NextApiRequest, res: NextApiResponse) => {
      res.status(401).send("No Authorization Header");
    });

    await withAudit(handler, { action: "x" })(request(), response());

    expect(written()).toMatchObject({ actor_account_id: null, actor_email: null, status: 401 });
  });

  it("records refusals, which are the interesting rows", async () => {
    // A run of denied attempts is exactly the pattern an audit is meant to surface.
    const handler = vi.fn(async (_req: NextApiRequest, res: NextApiResponse) => {
      res.status(405).send("Method not allowed");
    });

    await withAudit(handler, { action: "x" })(request({ method: "GET" }), response());

    expect(written()).toMatchObject({ status: 405, method: "GET" });
  });

  it("records the attempt when the handler throws, and still lets the error through", async () => {
    const boom = new Error("database on fire");
    const handler = vi.fn(async () => {
      throw boom;
    });

    await expect(withAudit(handler, { action: "x" })(request(), response())).rejects.toThrow(boom);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });

  it("does not fail the request when the log write fails", async () => {
    // Fail open, deliberately: a completed request is not undone because logging broke.
    mocks.create.mockRejectedValue(new Error("log table unavailable"));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn(async (_req: NextApiRequest, res: NextApiResponse) => {
      res.status(200).send("ok");
    });

    await expect(
      withAudit(handler, { action: "x" })(request(), response())
    ).resolves.toBeUndefined();
    expect(errors).toHaveBeenCalled(); // ...but loudly

    errors.mockRestore();
  });

  it("leaves the response object alone", async () => {
    // The wrapper reads res.statusCode; it must not replace res.status, or every caller holding
    // that method -- a test's spy, say -- ends up with a different function than the response has.
    const res = response();
    const statusBefore = res.status;
    const handler = vi.fn(async (_req: NextApiRequest, r: NextApiResponse) => {
      r.status(201).send("created");
    });

    await withAudit(handler, { action: "x" })(request(), res);

    expect(res.status).toBe(statusBefore);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith("created");
    expect(written()).toMatchObject({ status: 201 });
  });

  it("takes institute_id from the body only when it is really an id", async () => {
    const handler = vi.fn(async (_req: NextApiRequest, res: NextApiResponse) => {
      res.status(200).send("ok");
    });

    await withAudit(handler, { action: "x" })(request({ body: { institute_id: 3 } }), response());
    expect(written()).toMatchObject({ institute_id: 3 });

    vi.clearAllMocks();
    mocks.create.mockResolvedValue({});

    // A urlIdentifier is not an id; null is better than a slug in an int column.
    await withAudit(handler, { action: "x" })(
      request({ body: { institute_id: "alpha" } }),
      response()
    );
    expect(written()).toMatchObject({ institute_id: null });
  });

  it("carries route-supplied detail as JSON", async () => {
    const req = request();
    const handler = vi.fn(async (r: NextApiRequest, res: NextApiResponse) => {
      addAuditDetail(r, { revoked_institute: 2 });
      res.status(200).send("ok");
    });

    await withAudit(handler, { action: "x" })(req, response());

    expect(JSON.parse(written().detail)).toEqual({ revoked_institute: 2 });
  });

  it("writes no detail when a route supplied none", async () => {
    const handler = vi.fn(async (_req: NextApiRequest, res: NextApiResponse) => {
      res.status(200).send("ok");
    });

    await withAudit(handler, { action: "x" })(request(), response());

    expect(written().detail).toBeNull();
  });
});
