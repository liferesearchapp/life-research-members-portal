import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountDBRes } from "../../src/pages/api/account/[id]";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
}));

vi.mock("../../prisma/prisma-client", () => ({
  default: { $transaction: mocks.transaction },
}));

import {
  AccountDeletionError,
  deleteAccount,
  LastSuperAdminError,
} from "../../src/pages/api/delete-account/[id]";

type TargetAccount = {
  id: number;
  is_super_admin: boolean;
  member: {
    id: number;
    institutes: Array<{ instituteId: number }>;
  } | null;
};

function actor(id: number, isSuperAdmin: boolean) {
  return {
    id,
    instituteAdmin: [],
    is_super_admin: isSuperAdmin,
    member: null,
  } as unknown as NonNullable<AccountDBRes>;
}

function target(id: number, isSuperAdmin: boolean): TargetAccount {
  return { id, is_super_admin: isSuperAdmin, member: null };
}

function transactionClient(account: TargetAccount, superAdminCount: number) {
  return {
    account: {
      count: vi.fn().mockResolvedValue(superAdminCount),
      delete: vi.fn().mockResolvedValue(account),
      findUnique: vi.fn().mockResolvedValue(account),
    },
    instituteAdmin: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    instituteMembershipInvitation: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    memberInstitute: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  };
}

describe("deleteAccount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects deletion of the final super admin", async () => {
    const client = transactionClient(target(2, true), 1);
    mocks.transaction.mockImplementation(async (callback, options) => {
      expect(options).toEqual({
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
      return callback(client);
    });

    await expect(deleteAccount(2, actor(1, true))).rejects.toBeInstanceOf(
      LastSuperAdminError
    );
    expect(client.account.delete).not.toHaveBeenCalled();
  });

  it("serializes simultaneous cross-deletions so one super admin remains", async () => {
    const superAdmins = new Set([1, 2]);
    let transactionQueue = Promise.resolve<unknown>(undefined);

    mocks.transaction.mockImplementation((callback, options) => {
      expect(options).toEqual({
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });

      const result = transactionQueue.then(() => {
        const client = {
          account: {
            count: vi.fn(async () => superAdmins.size),
            delete: vi.fn(async ({ where }: { where: { id: number } }) => {
              superAdmins.delete(where.id);
              return target(where.id, true);
            }),
            findUnique: vi.fn(
              async ({ where }: { where: { id: number } }) =>
                superAdmins.has(where.id) ? target(where.id, true) : null
            ),
          },
          instituteAdmin: { deleteMany: vi.fn(async () => ({ count: 0 })) },
          instituteMembershipInvitation: {
            deleteMany: vi.fn(async () => ({ count: 0 })),
          },
          memberInstitute: { deleteMany: vi.fn(async () => ({ count: 0 })) },
        };
        return callback(client);
      });

      transactionQueue = result.then(
        () => undefined,
        () => undefined
      );
      return result;
    });

    const results = await Promise.allSettled([
      deleteAccount(2, actor(1, true)),
      deleteAccount(1, actor(2, true)),
    ]);

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    const rejected = results.find(({ status }) => status === "rejected");
    expect(rejected).toMatchObject({
      reason: expect.any(LastSuperAdminError),
      status: "rejected",
    });
    expect(superAdmins.size).toBe(1);
  });

  it("rechecks a target promoted during deletion", async () => {
    const client = transactionClient(target(2, true), 2);
    mocks.transaction.mockImplementation((callback) => callback(client));

    const error = await deleteAccount(2, actor(1, false)).catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(AccountDeletionError);
    expect(error).toMatchObject({ status: 401 });
    expect(client.account.count).not.toHaveBeenCalled();
    expect(client.account.delete).not.toHaveBeenCalled();
  });

  it("retries a serializable transaction conflict", async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError(
      "Transaction conflict",
      { code: "P2034", clientVersion: "4.10.1" }
    );
    const client = transactionClient(target(2, false), 1);
    mocks.transaction
      .mockRejectedValueOnce(conflict)
      .mockImplementationOnce((callback) => callback(client));

    await expect(deleteAccount(2, actor(1, true))).resolves.toMatchObject({
      id: 2,
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
  });
});
