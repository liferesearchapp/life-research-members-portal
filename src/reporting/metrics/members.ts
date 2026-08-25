import type { Prisma } from "@prisma/client";
import db from "../../../prisma/prisma-client";
import {
  blankLabel,
  labelGroups,
  nameMap,
  pageYearWhere,
  selectNames,
  selected,
  toYearSeries,
} from "./lib";
import { instituteFilter } from "./tenant";
import { defineMetric } from "./types";
import type { MetricFilters } from "./types";

/**
 * Members page metrics (ported from the 2024 Power BI dashboard).
 *
 * The member counts here needed no correction: Power BI counted member.id / member.is_active
 * directly off the member table, which is already one row per member. Only the institute
 * filter is new -- the Power BI model predates multi-institute RIMS and counted every member
 * in the database.
 */

/** Cross-filters from clicked marks, as a member predicate. */
function memberSelections(filters: MetricFilters): Prisma.memberWhereInput {
  const where: Prisma.memberWhereInput = {};

  const type = selected(filters, "member.type");
  if (type !== undefined) where.type_id = type as number | null;

  const faculty = selected(filters, "member.faculty");
  if (faculty !== undefined) where.faculty_id = faculty as number | null;

  const location = selected(filters, "member.location");
  if (location !== undefined) {
    // The location dimension is a composite label ("Ottawa, Canada"), so its key is the same
    // string and has to be split back apart. A blank means neither column was set.
    if (location === null) {
      where.city = null;
      where.country = null;
    } else {
      const [city, country] = String(location).split(", ");
      where.city = city ?? null;
      where.country = country ?? null;
    }
  }

  return where;
}

/**
 * Institute scope + the page's year filter (date_joined, "Joined Year" in Power BI) + any
 * cross-filters from clicked marks. Every tile on the page goes through this, so the figures
 * always agree with the controls above them.
 */
function memberWhere(instituteId: number, filters: MetricFilters): Prisma.memberWhereInput {
  return {
    ...instituteFilter.member(instituteId),
    ...pageYearWhere("date_joined", filters),
    ...memberSelections(filters),
  };
}

export const membersTotal = defineMetric({
  id: "members.total",
  shape: "scalar",
  entity: "member",
  title: { en: "Total Members", fr: "Membres au total" },
  run: async ({ instituteId, filters }) => ({
    value: await db.member.count({ where: memberWhere(instituteId, filters) }),
  }),
});

export const membersActive = defineMetric({
  id: "members.active",
  shape: "scalar",
  entity: "member",
  title: { en: "Active Members", fr: "Membres actifs" },
  run: async ({ instituteId, filters }) => ({
    value: await db.member.count({
      where: { ...memberWhere(instituteId, filters), is_active: true },
    }),
  }),
});

export const membersByType = defineMetric({
  id: "members.byType",
  shape: "breakdown",
  entity: "member",
  title: { en: "Members by Type", fr: "Membres par type" },
  dimension: "member.type",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, types] = await Promise.all([
      db.member.groupBy({
        by: ["type_id"],
        where: memberWhere(instituteId, filters),
        _count: { _all: true },
      }),
      db.member_type.findMany({ select: selectNames }),
    ]);
    return labelGroups(
      groups.map((g) => ({ key: g.type_id, count: g._count._all })),
      nameMap(types, lang),
      lang
    );
  },
});

export const membersByFaculty = defineMetric({
  id: "members.byFaculty",
  shape: "breakdown",
  entity: "member",
  title: { en: "Members by Faculty", fr: "Membres par faculté" },
  dimension: "member.faculty",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, faculties] = await Promise.all([
      db.member.groupBy({
        by: ["faculty_id"],
        where: memberWhere(instituteId, filters),
        _count: { _all: true },
      }),
      db.faculty.findMany({ select: selectNames }),
    ]);
    return labelGroups(
      groups.map((g) => ({ key: g.faculty_id, count: g._count._all })),
      nameMap(faculties, lang),
      lang
    );
  },
});

export const membersByJoinedYear = defineMetric({
  id: "members.byJoinedYear",
  shape: "series",
  entity: "member",
  title: { en: "Members by Joined Year", fr: "Membres par année d'adhésion" },
  run: async ({ instituteId, filters }) => {
    const rows = await db.member.findMany({
      where: memberWhere(instituteId, filters),
      select: { date_joined: true },
    });
    return toYearSeries(
      rows.map((r) => r.date_joined),
      filters
    );
  },
});

export const membersByLocation = defineMetric({
  id: "members.byLocation",
  shape: "breakdown",
  entity: "member",
  title: { en: "Members by Location", fr: "Membres par emplacement" },
  dimension: "member.location",
  run: async ({ instituteId, filters, lang }) => {
    const rows = await db.member.groupBy({
      by: ["city", "country"],
      where: memberWhere(instituteId, filters),
      _count: { _all: true },
    });
    // City and country are free text in RIMS, not lookup tables, so there is no name_fr to use
    // here -- the label is whatever was typed in.
    const blank = blankLabel(lang);
    const counts = new Map<string, number>();
    for (const r of rows) {
      const label = [r.city, r.country].filter(Boolean).join(", ") || blank;
      counts.set(label, (counts.get(label) ?? 0) + r._count._all);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({
        label,
        value,
        // Composite dimension: the label IS the key, and memberSelections splits it back.
        key: label === blank ? null : label,
      }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, lang));
  },
});

export const memberMetrics = [
  membersTotal,
  membersActive,
  membersByType,
  membersByFaculty,
  membersByJoinedYear,
  membersByLocation,
];
