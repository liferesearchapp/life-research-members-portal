import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccountFromRequest: vi.fn(),
  instituteFindUnique: vi.fn(),
}));

vi.mock("../../prisma/prisma-client", () => ({
  default: { institute: { findUnique: mocks.instituteFindUnique } },
}));
vi.mock("../../src/utils/api/get-account-from-request", () => ({
  default: mocks.getAccountFromRequest,
}));

import requireInstituteAccess from "../../src/utils/api/require-institute-access";

const req = { headers: { authorization: "Bearer t" } } as unknown as NextApiRequest;
function response() {
  const r = { status: vi.fn(), send: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  r.send.mockReturnValue(r);
  r.json.mockReturnValue(r);
  return r as unknown as NextApiResponse;
}
function account(instituteIds: number[], is_super_admin = false) {
  return {
    id: 1,
    is_super_admin,
    instituteAdmin: [],
    member: { id: 10, institutes: instituteIds.map((instituteId) => ({ instituteId })) },
  };
}

describe("requireInstituteAccess", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null and never resolves the institute when unauthenticated", async () => {
    mocks.getAccountFromRequest.mockResolvedValue(null); // sends its own 401
    const res = response();
    expect(await requireInstituteAccess(req, res, "alpha")).toBeNull();
    expect(mocks.instituteFindUnique).not.toHaveBeenCalled();
  });

  it("404s when the institute is unknown", async () => {
    mocks.getAccountFromRequest.mockResolvedValue(account([7]));
    mocks.instituteFindUnique.mockResolvedValue(null);
    const res = response();
    expect(await requireInstituteAccess(req, res, "ghost")).toBeNull();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("rejects a caller with no access to the institute", async () => {
    mocks.getAccountFromRequest.mockResolvedValue(account([2])); // member of institute 2
    mocks.instituteFindUnique.mockResolvedValue({ id: 7 }); // requested institute is 7
    const res = response();
    expect(await requireInstituteAccess(req, res, "alpha")).toBeNull();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns the id for a member of the institute", async () => {
    mocks.getAccountFromRequest.mockResolvedValue(account([7]));
    mocks.instituteFindUnique.mockResolvedValue({ id: 7 });
    expect(await requireInstituteAccess(req, response(), "alpha")).toBe(7);
  });

  it("returns the id for a super admin regardless of membership", async () => {
    mocks.getAccountFromRequest.mockResolvedValue(account([], true));
    mocks.instituteFindUnique.mockResolvedValue({ id: 7 });
    expect(await requireInstituteAccess(req, response(), "alpha")).toBe(7);
  });
});
