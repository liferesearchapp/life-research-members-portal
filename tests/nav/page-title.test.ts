import { describe, expect, it } from "vitest";
import { buildPageTitle } from "../../src/components/page-title";

/**
 * The tab title used to be the literal "LIFE" for every institute (issue #15). These pin the two
 * things that matters: it follows the selected institute, and it never falls back to naming one
 * particular institute.
 */
describe("buildPageTitle", () => {
  it("leads with the selected institute's acronym", () => {
    expect(buildPageTitle("/[instituteId]/members", true, "ALPHA")).toBe("ALPHA - Members");
  });

  it("names the section in French when the reader is in French", () => {
    expect(buildPageTitle("/[instituteId]/grants", false, "ALPHA")).toBe("ALPHA - Subventions");
  });

  it("falls back to a portal-wide name when no institute is selected", () => {
    // Never "LIFE": the fallback must not name one institute to readers of another.
    expect(buildPageTitle("/[instituteId]/members", true, "")).toBe("Research Portal - Members");
    expect(buildPageTitle("/[instituteId]/members", false, "")).toBe(
      "Portail de recherche - Membres"
    );
  });

  it("uses the institute alone when the route matches no section", () => {
    expect(buildPageTitle("/some/unmapped/route", true, "BETA")).toBe("BETA");
  });

  it("titles the cross-institute report, which belongs to no single institute", () => {
    expect(buildPageTitle("/admin-reports", true, "")).toBe("Research Portal - Reports");
  });

  it("titles the institutes list, which sits above any one institute", () => {
    expect(buildPageTitle("/institutes", true, "")).toBe("Research Portal - Institutes");
  });

  it("matches the home route both with and without an institute in the path", () => {
    expect(buildPageTitle("/", true, "")).toBe("Research Portal - Home");
    expect(buildPageTitle("/[instituteId]", true, "GAMMA")).toBe("GAMMA - Home");
  });
});
