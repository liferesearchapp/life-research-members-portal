import { describe, expect, it } from "vitest";
import { buildNavItems, type NavAccess, type NavItem } from "../../src/components/navbar/nav-items";

/** Base access with everything off; individual tests turn on what they need. */
function access(overrides: Partial<NavAccess> = {}): NavAccess {
  return {
    urlIdentifier: "alpha",
    en: true,
    loading: false,
    canAccessMemberPages: false,
    canAccessAdminPages: false,
    isSuperAdmin: false,
    hasInstituteAccess: false,
    hasLocalAccount: true,
    ...overrides,
  };
}

const labels = (items: NavItem[]) => items.map((i) => i.label);
const reports = (items: NavItem[]) => items.find((i) => i.label === "Reports");

describe("navbar Reports entry", () => {
  it("is hidden from a plain member (no admin, no super-admin)", () => {
    const items = buildNavItems(access({ canAccessMemberPages: true, hasInstituteAccess: true }));
    expect(labels(items)).not.toContain("Reports");
  });

  it("shows an institute admin a flat Reports link to their institute report", () => {
    const items = buildNavItems(
      access({ canAccessMemberPages: true, canAccessAdminPages: true, hasInstituteAccess: true })
    );
    const r = reports(items);
    expect(r).toBeDefined();
    expect(r!.children).toBeUndefined(); // flat, not a submenu
    expect(r!.href).toBe("/alpha/reports");
  });

  it("shows a super admin a Reports submenu with institute + all-institutes", () => {
    const items = buildNavItems(
      access({
        canAccessMemberPages: true,
        canAccessAdminPages: true,
        isSuperAdmin: true,
        hasInstituteAccess: true,
      })
    );
    const r = reports(items);
    expect(r).toBeDefined();
    expect(r!.children?.map((c) => c.href)).toEqual(["/alpha/reports", "/admin-reports"]);
  });

  it("uses the selected institute's urlIdentifier in the report link", () => {
    const items = buildNavItems(
      access({ urlIdentifier: "beta", canAccessAdminPages: true, hasInstituteAccess: true })
    );
    expect(reports(items)!.href).toBe("/beta/reports");
  });

  it("localizes the labels in French", () => {
    const items = buildNavItems(
      access({ en: false, canAccessAdminPages: true, isSuperAdmin: true, hasInstituteAccess: true })
    );
    const r = items.find((i) => i.label === "Rapports");
    expect(r).toBeDefined();
    expect(r!.children?.map((c) => c.label)).toEqual(["Rapport de l'institut", "Tous les instituts"]);
  });

  it("is not shown before an institute is selected (no urlIdentifier)", () => {
    // A super admin with no institute selected still sees the menu (Institutes link), but the
    // Reports entry is gated on a selected institute like the rest of the admin menu.
    const items = buildNavItems(
      access({ urlIdentifier: undefined, isSuperAdmin: true, hasInstituteAccess: true })
    );
    expect(labels(items)).not.toContain("Reports");
  });

  it("is suppressed while the account is still loading", () => {
    const items = buildNavItems(
      access({ loading: true, canAccessAdminPages: true, isSuperAdmin: true, hasInstituteAccess: true })
    );
    expect(labels(items)).not.toContain("Reports");
  });
});
