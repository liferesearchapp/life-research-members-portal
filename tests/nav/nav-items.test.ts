import { describe, expect, it } from "vitest";
import { buildNavItems, type NavAccess, type NavItem } from "../../src/components/navbar/nav-items";
import { bypassesInstituteSelection } from "../../src/utils/front-end/institute-routes";

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

/**
 * Bootstrapping the system (issue #14).
 *
 * A super admin has to be able to reach "Institutes" -> "Register" when there is no institute to
 * select -- on a fresh system, or when every institute has been deactivated. The navbar used to
 * appear only after an institute was chosen, which made that unreachable: no institute meant no
 * menu, and no menu meant no way to create the institute that would have provided one.
 *
 * The route side is handled in `_app.tsx`, where `/institutes*` renders outside `InstituteGuard`.
 * This covers the menu side: the entry that leads there has to survive with no institute selected.
 */
describe("navbar Institutes entry", () => {
  it("is offered to a super admin with no institute selected, so the system can be bootstrapped", () => {
    const items = buildNavItems(
      access({ urlIdentifier: undefined, isSuperAdmin: true, hasInstituteAccess: true })
    );

    const institutes = items.find((i) => i.label === "Institutes");
    expect(institutes).toBeDefined();
    expect(institutes!.href).toBe("/institutes");
  });

  it("survives every institute being deactivated, which leaves the same empty selection", () => {
    // Identical access shape to a fresh system: the account has rights, nothing to select.
    const items = buildNavItems(
      access({ urlIdentifier: undefined, isSuperAdmin: true, hasInstituteAccess: true })
    );

    expect(labels(items)).toEqual(["Institutes"]);
  });

  it("is localized", () => {
    const items = buildNavItems(
      access({ urlIdentifier: undefined, isSuperAdmin: true, hasInstituteAccess: true, en: false })
    );

    expect(labels(items)).toContain("Instituts");
  });

  it("is not offered to an account with no institute access at all", () => {
    const items = buildNavItems(access({ urlIdentifier: undefined }));

    expect(labels(items)).not.toContain("Institutes");
  });
});

/**
 * The route half of issue #14. The menu entry above is only useful if the page it points at
 * renders without an institute selected.
 */
describe("bypassesInstituteSelection", () => {
  it("lets the institute management pages render with nothing selected", () => {
    expect(bypassesInstituteSelection("/institutes")).toBe(true);
    expect(bypassesInstituteSelection("/institutes/register-institute")).toBe(true);
    expect(bypassesInstituteSelection("/institutes/3")).toBe(true);
  });

  it("still gates everything else on a selected institute", () => {
    // The deadlock this avoids is specific to the institute pages; opening it wider would let
    // institute-scoped pages render with no institute to scope them to.
    expect(bypassesInstituteSelection("/[instituteId]/members")).toBe(false);
    expect(bypassesInstituteSelection("/admin-reports")).toBe(false);
    expect(bypassesInstituteSelection("/my-profile")).toBe(false);
    expect(bypassesInstituteSelection("/")).toBe(false);
  });
});
