import { readdirSync, readFileSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, relative, resolve, sep } from "path";
import { describe, expect, it } from "vitest";

/**
 * Architecture tests over `src/pages/api/**`. Two properties, both of the kind that decay the
 * moment they depend on someone remembering:
 *
 *   1. every route gates access, or is explicitly listed as public;
 *   2. every route declares the HTTP methods it accepts, as its first act.
 *
 * Rather than a bespoke test per route, this scans `src/pages/api/**` and asserts each handler
 * either references an authentication/authorization primitive, or appears in the
 * INTENTIONALLY_PUBLIC allowlist below with a stated reason. A new route added without auth — and
 * not consciously allowlisted — fails CI. That is the point: making a route public becomes a
 * deliberate, reviewable act instead of an oversight.
 *
 * This does not prove a route's authorization logic is *correct* (the per-handler tests and
 * require-institute-access.test.ts do that) — it proves no route silently skips the check.
 */

const API_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../src/pages/api");

// The function names that gate a route. A route referencing any of these is considered guarded.
const AUTH_MARKERS = [
  "getAccountFromRequest", // authentication
  "assertAuthorized", // authorization
  "requireInstituteAccess", // shared institute-scoped list guard
  "requireInstituteReportingScope", // reporting
  "requireSuperReportingScope", // reporting
];

/**
 * Routes that are unauthenticated by design. Each entry is a path relative to src/pages/api
 * (forward slashes) mapped to the reason it is safe to expose without a token. Adding a route
 * here should be a conscious, reviewed decision.
 */
const INTENTIONALLY_PUBLIC: Record<string, string> = {
  // Public profile pages -- anonymous by design; the projections were tightened to expose no
  // home-contact or sign-in fields.
  "event/[id]/public.ts": "public profile page; safe projection",
  "grant/[id]/public.ts": "public profile page; safe projection",
  "member/[id]/public.ts": "public profile page; safe projection",
  "partner/[id]/public.ts": "public profile page; safe projection",
  "product/[id]/public.ts": "public profile page; safe projection",
  "supervision/[id]/public.ts": "public profile page; safe projection",

  // Anonymous, PII-free aggregate for the landing-page tiles (returns integers only).
  "public-counts.ts": "counts only; no rows, no PII",

  // Reference / lookup tables that populate form dropdowns. Static metadata, no personal data,
  // not tenant-scoped. Candidates for gating later if desired -- see the PR notes.
  "all-event-types.ts": "reference lookup (event types)",
  "all-faculties.ts": "reference lookup (faculties)",
  "all-keywords.ts": "reference lookup (keywords)",
  "all-levels.ts": "reference lookup (supervision levels)",
  "all-member-types.ts": "reference lookup (member types)",
  "all-org-scopes.ts": "reference lookup (organization scopes)",
  "all-org-types.ts": "reference lookup (organization types)",
  "all-product-types.ts": "reference lookup (product types)",
  "all-sources.ts": "reference lookup (grant sources)",
  "all-statuses.ts": "reference lookup (grant statuses)",
  "all-targets.ts": "reference lookup (targets)",
  "all-topics.ts": "reference lookup (topics)",
};

function listRoutes(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listRoutes(full));
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const routes = listRoutes(API_DIR).map((f) => ({
  rel: relative(API_DIR, f).split(sep).join("/"),
  source: readFileSync(f, "utf8"),
}));

const isGuarded = (source: string) => AUTH_MARKERS.some((m) => source.includes(m));

describe("every API route gates access or is explicitly public", () => {
  it("finds the route directory", () => {
    expect(routes.length).toBeGreaterThan(50); // sanity: the scan actually found the routes
  });

  it("has no route that is unauthenticated and not on the public allowlist", () => {
    const offenders = routes
      .filter((r) => !isGuarded(r.source) && !(r.rel in INTENTIONALLY_PUBLIC))
      .map((r) => r.rel);

    // If this fails: either add an auth check to the route, or, if it is meant to be public,
    // add it to INTENTIONALLY_PUBLIC with a reason.
    expect(offenders).toEqual([]);
  });

  it("keeps the public allowlist precise (no stale or now-guarded entries)", () => {
    const byRel = new Map(routes.map((r) => [r.rel, r]));
    const stale: string[] = [];
    const nowGuarded: string[] = [];

    for (const rel of Object.keys(INTENTIONALLY_PUBLIC)) {
      const route = byRel.get(rel);
      if (!route) stale.push(rel); // allowlisted path no longer exists (renamed/deleted)
      else if (isGuarded(route.source)) nowGuarded.push(rel); // now authed -> remove from allowlist
    }

    expect({ stale, nowGuarded }).toEqual({ stale: [], nowGuarded: [] });
  });
});

/** Verbs `methodAllowed` accepts. Keep in sync with HttpMethod in the helper. */
const VALID_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/**
 * The body of the default handler, from the opening brace of its parameter list, with any
 * leading comments stripped -- a note explaining the chosen verbs is welcome above the guard and
 * does not make the guard any less first.
 *
 * Returns null when the route does not use the repo's one handler shape.
 */
function handlerBody(source: string): string | null {
  const start = source.indexOf("export default async function handler(");
  if (start === -1) return null;
  const open = source.indexOf(") {", start);
  if (open === -1) return null;

  let body = source.slice(open + ") {".length);
  let previous;
  do {
    previous = body;
    body = body.replace(/^\s*\/\/[^\n]*/, "").replace(/^\s*\/\*[\s\S]*?\*\//, "");
  } while (body !== previous);

  return body;
}

const GUARD = /^\s*if \(!methodAllowed\(req, res, \[([^\]]*)\]\)\) return;/;

describe("every API route declares the HTTP methods it accepts", () => {
  it("guards every route, as the first statement of its handler", () => {
    // First statement specifically: a method check that runs after a query has already been
    // issued protects nothing. Placing it first is the whole point.
    const offenders = routes
      .filter((r) => {
        const body = handlerBody(r.source);
        return body === null || !GUARD.test(body);
      })
      .map((r) => r.rel);

    // If this fails: add `if (!methodAllowed(req, res, ["GET"])) return;` as the first line of
    // the handler, naming the verbs this route actually implements.
    expect(offenders).toEqual([]);
  });

  it("declares only real HTTP methods, and no duplicates", () => {
    const bad: Record<string, string[]> = {};

    for (const r of routes) {
      const body = handlerBody(r.source);
      const match = body?.match(GUARD);
      if (!match) continue;

      const declared = match[1]
        .split(",")
        .map((v) => v.trim().replace(/"/g, ""))
        .filter(Boolean);

      const unknown = declared.filter((v) => !VALID_METHODS.includes(v));
      const duplicated = declared.filter((v, i) => declared.indexOf(v) !== i);
      if (unknown.length || duplicated.length) bad[r.rel] = [...unknown, ...duplicated];
    }

    expect(bad).toEqual({});
  });

  it("leaves no hand-rolled method check behind", () => {
    // The helper is the single mechanism. A leftover `req.method !== "PATCH"` gate is a second
    // one that can drift from it. Reading req.method to *dispatch* between verbs is fine, so
    // only comparison-against-a-literal in a guard position is flagged.
    const offenders = routes
      .filter((r) => /req\.method\s*!==\s*"/.test(r.source))
      .map((r) => r.rel);

    expect(offenders).toEqual([]);
  });
});
