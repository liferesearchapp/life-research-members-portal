import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Guards the wiring: every public list endpoint must go through an auth check before returning
// rows. The shared guard's own logic is covered by require-institute-access.test.ts; here we
// confirm each endpoint actually calls it (institute-scoped) or getAccountFromRequest (the two
// cross-institute helpers), and returns nothing when access is denied.
const mocks = vi.hoisted(() => ({
  requireInstituteAccess: vi.fn(),
  getAccountFromRequest: vi.fn(),
  product: vi.fn(),
  grant: vi.fn(),
  event: vi.fn(),
  supervision: vi.fn(),
  organization: vi.fn(),
  member: vi.fn(),
}));

vi.mock("../../src/utils/api/require-institute-access", () => ({
  default: mocks.requireInstituteAccess,
}));
vi.mock("../../src/utils/api/get-account-from-request", () => ({
  default: mocks.getAccountFromRequest,
}));
vi.mock("../../prisma/prisma-client", () => ({
  default: {
    product: { findMany: mocks.product },
    grant: { findMany: mocks.grant },
    event: { findMany: mocks.event },
    supervision: { findMany: mocks.supervision },
    organization: { findMany: mocks.organization },
    member: { findMany: mocks.member },
  },
}));
vi.mock("../../prisma/helpers", () => ({
  selectPublicProductInfo: {},
  selectPublicGrantInfo: {},
  selectPublicEventInfo: {},
  selectPublicSupervisionInfo: {},
  selectPublicPartnerInfo: {},
  selectPublicMemberInfo: {},
}));

import allProducts from "../../src/pages/api/all-products";
import allPartners from "../../src/pages/api/all-partners";
import allEvents from "../../src/pages/api/all-events";
import allGrants from "../../src/pages/api/all-grants";
import allSupervisions from "../../src/pages/api/all-supervisions";
import allMembers from "../../src/pages/api/all-members";
import allOrganizations from "../../src/pages/api/all-organizations";
import allProductTitles from "../../src/pages/api/all-product-titles";

function response() {
  const r = { status: vi.fn(), send: vi.fn(), json: vi.fn() };
  r.status.mockReturnValue(r);
  r.send.mockReturnValue(r);
  r.json.mockReturnValue(r);
  return r as unknown as NextApiResponse;
}
const withInstitute = { query: { instituteId: "alpha" } } as unknown as NextApiRequest;
const noQuery = { query: {} } as unknown as NextApiRequest;

const scoped = [
  { name: "all-members", handler: allMembers, model: mocks.member },
  { name: "all-products", handler: allProducts, model: mocks.product },
  { name: "all-partners", handler: allPartners, model: mocks.organization },
  { name: "all-events", handler: allEvents, model: mocks.event },
  { name: "all-grants", handler: allGrants, model: mocks.grant },
  { name: "all-supervisions", handler: allSupervisions, model: mocks.supervision },
];

describe("institute-scoped list endpoints go through the access guard", () => {
  beforeEach(() => vi.clearAllMocks());

  for (const { name, handler, model } of scoped) {
    it(`${name}: returns no rows when the guard denies access`, async () => {
      mocks.requireInstituteAccess.mockResolvedValue(null); // guard already sent 401/403/404
      const res = response();
      await handler(withInstitute, res);
      expect(mocks.requireInstituteAccess).toHaveBeenCalled();
      expect(model).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(200);
    });

    it(`${name}: queries and 200s when the guard grants access`, async () => {
      mocks.requireInstituteAccess.mockResolvedValue(7);
      model.mockResolvedValue([]);
      const res = response();
      await handler(withInstitute, res);
      expect(model).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  }
});

const unscoped = [
  { name: "all-organizations", handler: allOrganizations, model: mocks.organization },
  { name: "all-product-titles", handler: allProductTitles, model: mocks.product },
];

describe("cross-institute helper endpoints require authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  for (const { name, handler, model } of unscoped) {
    it(`${name}: returns no rows when unauthenticated`, async () => {
      mocks.getAccountFromRequest.mockResolvedValue(null); // sends its own 401
      const res = response();
      await handler(noQuery, res);
      expect(model).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(200);
    });

    it(`${name}: 200s when authenticated`, async () => {
      mocks.getAccountFromRequest.mockResolvedValue({ id: 1 });
      model.mockResolvedValue([]);
      const res = response();
      await handler(noQuery, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  }
});
