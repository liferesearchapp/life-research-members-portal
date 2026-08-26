import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  count: vi.fn(),
  getAccountFromRequest: vi.fn(),
  transaction: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("../../prisma/prisma-client", () => ({
  default: {
    account: {
      findUnique: mocks.findUnique,
      update: mocks.update,
      count: mocks.count,
    },
    // The route is audited; without this the audit write fails open and fills the output with
    // the error it logs on the way past.
    auditEvent: { create: mocks.auditCreate },
    // Run the callback against the same mocked model, as delete-account's tests do.
    $transaction: mocks.transaction,
  },
}));

vi.mock("../../src/utils/api/get-account-from-request", () => ({
  default: mocks.getAccountFromRequest,
}));

import handler, {
  removeSuperAdmin,
  LastSuperAdminError,
  RemoveSuperAdminError,
} from "../../src/pages/api/update-account/[id]/remove-super-admin";

function request(id = "2") {
  return {
    headers: { authorization: "Bearer test" },
    method: "PATCH",
    query: { id },
  } as unknown as NextApiRequest;
}

function response() {
  const res = { statusCode: 200, send: vi.fn(), setHeader: vi.fn(), status: vi.fn() };
  res.send.mockReturnValue(res);
  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  return res as unknown as NextApiResponse;
}

const prismaLike = {
  account: { findUnique: mocks.findUnique, update: mocks.update, count: mocks.count },
};

beforeEach(() => {
  // resetAllMocks, not clearAllMocks: `clear` keeps implementations, so a mockResolvedValue set in
  // one test leaks into the next. That is not hypothetical -- it made the self-demotion test below
  // pass even with the guard removed, because a leftover account happened to produce the same
  // status by another route.
  vi.resetAllMocks();
  mocks.transaction.mockImplementation(async (fn: any) => fn(prismaLike));
});

describe("removeSuperAdmin", () => {
  it("revokes the privilege when another super admin remains", async () => {
    mocks.findUnique.mockResolvedValue({ id: 2, is_super_admin: true });
    mocks.count.mockResolvedValue(2);
    mocks.update.mockResolvedValue({ id: 2, is_super_admin: false });

    await removeSuperAdmin(2);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2 }, data: { is_super_admin: false } })
    );
  });

  it("refuses to demote the final super admin", async () => {
    // Otherwise nobody could grant the privilege back and the system becomes unadministrable.
    mocks.findUnique.mockResolvedValue({ id: 2, is_super_admin: true });
    mocks.count.mockResolvedValue(1);

    await expect(removeSuperAdmin(2)).rejects.toBeInstanceOf(LastSuperAdminError);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("counts and updates inside one serializable transaction", async () => {
    // Two super admins demoting each other at once would otherwise both read a count of two,
    // both proceed, and leave zero.
    mocks.findUnique.mockResolvedValue({ id: 2, is_super_admin: true });
    mocks.count.mockResolvedValue(2);
    mocks.update.mockResolvedValue({ id: 2 });

    await removeSuperAdmin(2);

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.transaction.mock.calls[0][1]).toMatchObject({
      isolationLevel: "Serializable",
    });
  });

  it("rejects an account that does not exist", async () => {
    mocks.findUnique.mockResolvedValue(null);

    await expect(removeSuperAdmin(2)).rejects.toBeInstanceOf(RemoveSuperAdminError);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects an account that is not a super admin", async () => {
    mocks.findUnique.mockResolvedValue({ id: 2, is_super_admin: false });

    await expect(removeSuperAdmin(2)).rejects.toBeInstanceOf(RemoveSuperAdminError);
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("remove-super-admin API", () => {
  it("refuses a verb it does not implement, before authenticating", async () => {
    const res = response();

    await handler({ ...request(), method: "GET" } as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(mocks.getAccountFromRequest).not.toHaveBeenCalled();
  });

  it("rejects a caller who is not a super admin", async () => {
    mocks.getAccountFromRequest.mockResolvedValue({ id: 1, is_super_admin: false });
    const res = response();

    await handler(request(), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("refuses a super admin trying to demote themselves", async () => {
    // The same protection delete-account applies to self-deletion: it is the easy way to lock
    // yourself out. Another super admin can always do it.
    mocks.getAccountFromRequest.mockResolvedValue({ id: 2, is_super_admin: true });
    const res = response();

    await handler(request("2"), res);

    expect(res.status).toHaveBeenCalledWith(400);
    // Refused before any database work: the transaction is never entered.
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("lets one super admin demote another", async () => {
    mocks.getAccountFromRequest.mockResolvedValue({ id: 1, is_super_admin: true });
    mocks.findUnique.mockResolvedValue({ id: 2, is_super_admin: true });
    mocks.count.mockResolvedValue(2);
    mocks.update.mockResolvedValue({ id: 2, is_super_admin: false });
    const res = response();

    await handler(request("2"), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { is_super_admin: false } })
    );
  });

  it("answers 409 rather than 500 when the target is the last super admin", async () => {
    mocks.getAccountFromRequest.mockResolvedValue({ id: 1, is_super_admin: true });
    mocks.findUnique.mockResolvedValue({ id: 2, is_super_admin: true });
    mocks.count.mockResolvedValue(1);
    const res = response();

    await handler(request("2"), res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("requires a numeric account id", async () => {
    mocks.getAccountFromRequest.mockResolvedValue({ id: 1, is_super_admin: true });
    const res = response();

    await handler(request("not-a-number"), res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
