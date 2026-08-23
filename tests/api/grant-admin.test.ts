import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  accountFindUnique: vi.fn(),
  adminUpsert: vi.fn(),
  instituteFindUnique: vi.fn(),
  memberCreate: vi.fn(),
  membershipUpsert: vi.fn(),
}));

vi.mock("../../prisma/prisma-client", () => ({
  default: {
    account: { findUnique: mocks.accountFindUnique },
    institute: { findUnique: mocks.instituteFindUnique },
    instituteAdmin: { upsert: mocks.adminUpsert },
    member: { create: mocks.memberCreate },
    memberInstitute: { upsert: mocks.membershipUpsert },
  },
}));

import { updateAccountGrantAdmin } from "../../src/pages/api/update-account/[id]/grant-admin";

describe("grant institute admin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("assigns an administrator without creating a member or membership", async () => {
    mocks.instituteFindUnique.mockResolvedValue({ id: 1 });
    mocks.accountFindUnique.mockResolvedValue({ id: 159 });
    mocks.adminUpsert.mockResolvedValue({ accountId: 159, instituteId: 1 });

    await expect(updateAccountGrantAdmin(159, "lri")).resolves.toEqual({
      accountId: 159,
      instituteId: 1,
    });

    expect(mocks.adminUpsert).toHaveBeenCalledWith({
      where: {
        accountId_instituteId: { accountId: 159, instituteId: 1 },
      },
      create: { accountId: 159, instituteId: 1 },
      update: {},
    });
    expect(mocks.memberCreate).not.toHaveBeenCalled();
    expect(mocks.membershipUpsert).not.toHaveBeenCalled();
  });
});
