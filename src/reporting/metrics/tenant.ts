import type { Prisma } from "@prisma/client";

/**
 * Institute scoping.
 *
 * RIMS tenancy is two-tier, so there is no single "add a tenant filter" helper:
 *
 *  - Owned    : grant, event, supervision each carry a non-nullable instituteId FK -> plain equality.
 *  - Shared   : member, product, organization belong to many institutes via join tables -> `some` filter.
 *
 * The relation field names are NOT uniform (member/product expose `institutes`, organization exposes
 * `organizationInstitute`), so they are spelled out here rather than derived.
 */

export type TenantedEntity =
  | "member"
  | "product"
  | "organization"
  | "grant"
  | "event"
  | "supervision";

export const SHARED_ENTITIES = ["member", "product", "organization"] as const;
export const OWNED_ENTITIES = ["grant", "event", "supervision"] as const;

export const instituteFilter = {
  member: (instituteId: number): Prisma.memberWhereInput => ({
    institutes: { some: { instituteId } },
  }),
  product: (instituteId: number): Prisma.productWhereInput => ({
    institutes: { some: { instituteId } },
  }),
  organization: (instituteId: number): Prisma.organizationWhereInput => ({
    organizationInstitute: { some: { instituteId } },
  }),
  grant: (instituteId: number): Prisma.grantWhereInput => ({ instituteId }),
  event: (instituteId: number): Prisma.eventWhereInput => ({ instituteId }),
  supervision: (instituteId: number): Prisma.supervisionWhereInput => ({ instituteId }),
};
