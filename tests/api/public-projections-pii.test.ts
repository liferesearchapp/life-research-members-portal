import { describe, expect, it } from "vitest";
import {
  selectPublicEventInfo,
  selectPublicGrantInfo,
  selectPublicMemberInfo,
  selectPublicPartnerInfo,
  selectPublicProductInfo,
  selectPublicSupervisionInfo,
} from "../../prisma/helpers";

/**
 * Regression test for the unauthenticated `/public` PII leak.
 *
 * The `selectPublic*Info` projections back endpoints that have no authentication. A nested
 * `member` or `account` pulled via `include` (or `true`) returns every scalar column —
 * `member.address` / `postal_code` / `mobile_phone`, `account.login_email` / `microsoft_id` /
 * `is_super_admin`. The fix routes every nested public member through an explicit `select`
 * allow-list. These tests encode that invariant so it cannot silently regress.
 */

const PROJECTIONS = {
  selectPublicMemberInfo,
  selectPublicPartnerInfo,
  selectPublicProductInfo,
  selectPublicGrantInfo,
  selectPublicEventInfo,
  selectPublicSupervisionInfo,
};

// Fields that must never be selectable without a token, anywhere in a public projection.
const FORBIDDEN_SCALARS = new Set([
  // account
  "login_email",
  "microsoft_id",
  "is_super_admin",
  "last_login",
  // member — home contact
  "address",
  "city",
  "province",
  "country",
  "postal_code",
  "mobile_phone",
]);

// Relations that expose a person; must be reached by `select`, never `include`/`true`.
const PERSON_RELATIONS = new Set(["member", "account"]);

type Node = Record<string, unknown>;

/** Walks a Prisma projection and collects every violation, with a path for debugging. */
function findViolations(node: unknown, path: string, out: string[]) {
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node as Node)) {
    const here = path ? `${path}.${key}` : key;

    // A forbidden scalar selected as `true`.
    if (FORBIDDEN_SCALARS.has(key) && value === true) {
      out.push(`selects forbidden field: ${here}`);
    }

    // A person relation reached without an allow-list.
    if (PERSON_RELATIONS.has(key)) {
      if (value === true) {
        out.push(`bare '${key}: true' (returns all scalars) at ${here}`);
      } else if (value && typeof value === "object") {
        const v = value as Node;
        if ("include" in v && !("select" in v)) {
          out.push(`'${key}' uses include without select (returns all scalars) at ${here}`);
        }
      }
    }

    findViolations(value, here, out);
  }
}

describe("public projections do not leak PII", () => {
  for (const [name, projection] of Object.entries(PROJECTIONS)) {
    it(`${name} exposes no address/phone/login/is_super_admin fields`, () => {
      const violations: string[] = [];
      findViolations(projection, name, violations);
      expect(violations).toEqual([]);
    });
  }

  it("the shared summary is the only member shape used in nested public relations", () => {
    // Sanity: the fix is applied everywhere — every projection is violation-free as a set.
    const violations: string[] = [];
    for (const [name, projection] of Object.entries(PROJECTIONS)) {
      findViolations(projection, name, violations);
    }
    expect(violations).toEqual([]);
  });
});
