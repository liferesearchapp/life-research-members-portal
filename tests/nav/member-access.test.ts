import { describe, expect, it } from "vitest";
import { canManageMemberProfile } from "../../src/utils/front-end/member-access";

/**
 * The reported bug: an institute admin could not edit a member of their own institute, while a
 * super admin could. The rule was right; it ran too early. The profile evaluated it during the
 * first render, when the member had not loaded and therefore belonged to no institutes, so no
 * institute overlapped and the admin was redirected to the public profile before their data
 * arrived. Super admins never hit it, because the check short-circuits for them.
 *
 * Hence the third state: while the member is loading the answer is `undefined`, not `false`.
 */
describe("canManageMemberProfile", () => {
  it("lets an institute admin manage a member of an institute they administer", () => {
    expect(
      canManageMemberProfile({
        isSuperAdmin: false,
        adminInstituteIds: [2],
        memberInstituteIds: [2],
      })
    ).toBe(true);
  });

  it("lets an institute admin manage a member who shares just one of several institutes", () => {
    expect(
      canManageMemberProfile({
        isSuperAdmin: false,
        adminInstituteIds: [1, 4],
        memberInstituteIds: [7, 4, 9],
      })
    ).toBe(true);
  });

  it("refuses an institute admin with no institute in common", () => {
    expect(
      canManageMemberProfile({
        isSuperAdmin: false,
        adminInstituteIds: [1],
        memberInstituteIds: [2],
      })
    ).toBe(false);
  });

  it("refuses an account that administers nothing", () => {
    expect(
      canManageMemberProfile({
        isSuperAdmin: false,
        adminInstituteIds: [],
        memberInstituteIds: [2],
      })
    ).toBe(false);
  });

  it("lets a super admin manage any member", () => {
    expect(
      canManageMemberProfile({
        isSuperAdmin: true,
        adminInstituteIds: [],
        memberInstituteIds: [99],
      })
    ).toBe(true);
  });

  it("answers 'not yet' while the member is still loading, rather than 'no'", () => {
    // This is the regression. Returning false here is what redirected the admin away, and it did
    // so on the very first render, before the member could possibly have arrived.
    expect(
      canManageMemberProfile({
        isSuperAdmin: false,
        adminInstituteIds: [2],
        memberInstituteIds: undefined,
      })
    ).toBeUndefined();
  });

  it("distinguishes an account with no institutes from one that has not loaded", () => {
    // The distinction the whole rule turns on. An empty list is a definite "no shared institute" --
    // a loaded account that simply has no member record. `undefined` means "ask again later".
    // Collapsing the two onto [] is what redirected institute admins away mid-load.
    expect(
      canManageMemberProfile({
        isSuperAdmin: false,
        adminInstituteIds: [1],
        memberInstituteIds: [],
      })
    ).toBe(false);

    expect(
      canManageMemberProfile({
        isSuperAdmin: false,
        adminInstituteIds: [1],
        memberInstituteIds: undefined,
      })
    ).toBeUndefined();
  });

  it("still answers immediately for a super admin, loaded or not", () => {
    expect(
      canManageMemberProfile({
        isSuperAdmin: true,
        adminInstituteIds: [],
        memberInstituteIds: undefined,
      })
    ).toBe(true);
  });
});
