import type { Prisma } from "@prisma/client";
import db from "../../../prisma/prisma-client";
import { labelGroups, nameMap, selectNames, selected } from "./lib";
import { instituteFilter } from "./tenant";
import { defineMetric } from "./types";
import type { MetricFilters } from "./types";

/**
 * Organizations page metrics (ported from the 2024 Power BI dashboard).
 *
 * Counts needed no correction -- Power BI counted organization.id off the organization table
 * directly. Only the institute filter is new, and organizations are a *shared* entity, so it
 * is a join against organizationInstitute rather than a column comparison.
 */

/**
 * Institute scope + cross-filters from clicked marks.
 * Organizations carry no date, so this page has no year filter.
 */
function organizationWhere(
  instituteId: number,
  filters: MetricFilters
): Prisma.organizationWhereInput {
  const where: Prisma.organizationWhereInput = instituteFilter.organization(instituteId);

  const scope = selected(filters, "organization.scope");
  if (scope !== undefined) where.scope_id = scope as number | null;

  const type = selected(filters, "organization.type");
  if (type !== undefined) where.type_id = type as number | null;

  return where;
}

export const organizationsTotal = defineMetric({
  id: "organizations.total",
  shape: "scalar",
  entity: "organization",
  title: { en: "Total Organizations", fr: "Organisations au total" },
  run: async ({ instituteId, filters }) => ({
    value: await db.organization.count({ where: organizationWhere(instituteId, filters) }),
  }),
});

export const organizationsByScope = defineMetric({
  id: "organizations.byScope",
  shape: "breakdown",
  entity: "organization",
  title: { en: "Organizations by Scope", fr: "Organisations par portée" },
  dimension: "organization.scope",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, scopes] = await Promise.all([
      db.organization.groupBy({
        by: ["scope_id"],
        where: organizationWhere(instituteId, filters),
        _count: { _all: true },
      }),
      db.org_scope.findMany({ select: selectNames }),
    ]);
    return labelGroups(
      groups.map((g) => ({ key: g.scope_id, count: g._count._all })),
      nameMap(scopes, lang),
      lang
    );
  },
});

export const organizationsByType = defineMetric({
  id: "organizations.byType",
  shape: "breakdown",
  entity: "organization",
  title: { en: "Organizations by Type", fr: "Organisations par type" },
  dimension: "organization.type",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, types] = await Promise.all([
      db.organization.groupBy({
        by: ["type_id"],
        where: organizationWhere(instituteId, filters),
        _count: { _all: true },
      }),
      db.org_type.findMany({ select: selectNames }),
    ]);
    return labelGroups(
      groups.map((g) => ({ key: g.type_id, count: g._count._all })),
      nameMap(types, lang),
      lang
    );
  },
});

export const organizationsList = defineMetric({
  id: "organizations.list",
  shape: "rows",
  entity: "organization",
  title: { en: "Organizations", fr: "Organisations" },
  run: async ({ instituteId, filters, lang }) => {
    const rows = await db.organization.findMany({
      where: organizationWhere(instituteId, filters),
      select: { id: true, name_en: true, name_fr: true, description: true },
      orderBy: lang === "fr" ? { name_fr: "asc" } : { name_en: "asc" },
    });
    // One name column in the reader's language, rather than showing both and making them read
    // past the one they don't want.
    return rows.map((r) => ({
      id: r.id,
      name: lang === "fr" ? r.name_fr : r.name_en,
      description: r.description,
    }));
  },
});

export const organizationMetrics = [
  organizationsTotal,
  organizationsByScope,
  organizationsByType,
  organizationsList,
];
