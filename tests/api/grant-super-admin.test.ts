import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  getAccountFromRequest: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../../prisma/prisma-client", () => ({
  default: {
    account: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

vi.mock("../../src/utils/api/get-account-from-request", () => ({
  default: mocks.getAccountFromRequest,
}));

import handler from "../../src/pages/api/update-account/[id]/grant-super-admin";

function request(id = "2") {
  return {
    headers: { authorization: "Bearer test" },
    method: "PATCH",
    query: { id },
  } as unknown as NextApiRequest;
}

function response() {
  const res = {
    send: vi.fn(),
    setHeader: vi.fn(),
    status: vi.fn(),
  };
  res.send.mockReturnValue(res);
  res.status.mockReturnValue(res);
  return res as unknown as NextApiResponse;
}

describe("grant-super-admin API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses a verb it does not implement, before authenticating or touching the database", () => {
    // The route is PATCH-only. Next matches a handler on path alone, so without the method gate
    // a GET would run the promotion. Checked on a real route, not just on the helper: the guard
    // has to be wired in, and wired in first.
    const res = response();

    handler({ ...request(), method: "GET" } as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "PATCH");
    expect(mocks.getAccountFromRequest).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects a caller who is not a super admin", async () => {
    mocks.getAccountFromRequest.mockResolvedValue({ is_super_admin: false });
    const res = response();

    await handler(request(), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("allows a super admin to promote an existing account", async () => {
    const updatedAccount = { id: 2, is_super_admin: true };
    mocks.getAccountFromRequest.mockResolvedValue({ is_super_admin: true });
    mocks.findUnique.mockResolvedValue({ id: 2 });
    mocks.update.mockResolvedValue(updatedAccount);
    const res = response();

    await handler(request(), res);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { is_super_admin: true },
        where: { id: 2 },
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(updatedAccount);
  });

  it("returns 404 when the target account does not exist", async () => {
    mocks.getAccountFromRequest.mockResolvedValue({ is_super_admin: true });
    mocks.findUnique.mockResolvedValue(null);
    const res = response();

    await handler(request(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
