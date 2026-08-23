import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  instituteFindUnique: vi.fn(),
  memberFindMany: vi.fn(),
  getAccountFromRequest: vi.fn(),
}));

vi.mock("../../prisma/prisma-client", () => ({
  default: {
    institute: { findUnique: mocks.instituteFindUnique },
    member: { findMany: mocks.memberFindMany },
  },
}));

vi.mock("../../src/utils/api/get-account-from-request", () => ({
  default: mocks.getAccountFromRequest,
}));

// The projection is a plain object; the real one is fine to import here.
vi.mock("../../prisma/helpers", () => ({ selectPublicMemberInfo: {} }));

import handler from "../../src/pages/api/all-members";

function request(instituteId = "alpha") {
  return {
    headers: { authorization: "Bearer test" },
    method: "GET",
    query: { instituteId },
  } as unknown as NextApiRequest;
}

/** A request with no instituteId at all (empty query) — passing undefined would hit the default. */
function requestNoInstitute() {
  return {
    headers: { authorization: "Bearer test" },
    method: "GET",
    query: {},
  } as unknown as NextApiRequest;
}

function response() {
  const res = { json: vi.fn(), send: vi.fn(), setHeader: vi.fn(), status: vi.fn() };
  res.json.mockReturnValue(res);
  res.send.mockReturnValue(res);
  res.status.mockReturnValue(res);
  return res as unknown as NextApiResponse;
}

/** An account that administers/belongs to the institutes whose ids are listed. */
function accountInInstitutes(instituteIds: number[], is_super_admin = false) {
  return {
    id: 1,
    is_super_admin,
    instituteAdmin: [],
    member: { id: 10, institutes: instituteIds.map((instituteId) => ({ instituteId })) },
  };
}

describe("all-members API authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not return the roster when the caller is unauthenticated", async () => {
    // getAccountFromRequest sends its own 401 and resolves null.
    mocks.getAccountFromRequest.mockResolvedValue(null);
    const res = response();

    await handler(request("alpha"), res);

    expect(mocks.memberFindMany).not.toHaveBeenCalled();
    expect(mocks.instituteFindUnique).not.toHaveBeenCalled();
  });

  it("rejects a caller with no access to the requested institute (401), without querying members", async () => {
    mocks.getAccountFromRequest.mockResolvedValue(accountInInstitutes([2])); // member of institute 2
    mocks.instituteFindUnique.mockResolvedValue({ id: 7 }); // requested institute is 7
    const res = response();

    await handler(request("alpha"), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.memberFindMany).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown institute (authenticated caller)", async () => {
    mocks.getAccountFromRequest.mockResolvedValue(accountInInstitutes([7]));
    mocks.instituteFindUnique.mockResolvedValue(null);
    const res = response();

    await handler(request("ghost"), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mocks.memberFindMany).not.toHaveBeenCalled();
  });

  it("returns 400 when no institute is supplied", async () => {
    const res = response();
    await handler(requestNoInstitute(), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.getAccountFromRequest).not.toHaveBeenCalled();
  });

  it("returns the roster for a member of the institute", async () => {
    mocks.getAccountFromRequest.mockResolvedValue(accountInInstitutes([7]));
    mocks.instituteFindUnique.mockResolvedValue({ id: 7 });
    mocks.memberFindMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const res = response();

    await handler(request("alpha"), res);

    expect(mocks.memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { institutes: { some: { instituteId: 7 } } } })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("allows a super admin regardless of institute membership", async () => {
    mocks.getAccountFromRequest.mockResolvedValue(accountInInstitutes([], true));
    mocks.instituteFindUnique.mockResolvedValue({ id: 7 });
    mocks.memberFindMany.mockResolvedValue([]);
    const res = response();

    await handler(request("alpha"), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.memberFindMany).toHaveBeenCalled();
  });
});
