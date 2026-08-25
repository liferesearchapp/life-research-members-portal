import type { Prisma } from "@prisma/client";
import db from "../../../prisma/prisma-client";
import { labelGroups, nameMap, pageYearWhere, selectNames, selected } from "./lib";
import { instituteFilter } from "./tenant";
import { defineMetric } from "./types";
import type { MetricFilters } from "./types";

/**
 * Supervisions page metrics (ported from the 2024 Power BI dashboard, counts corrected).
 *
 * Power BI bound both donuts to supervision_principal_supervisor.supervision_id -- a row in the
 * principal-supervisor join table, not a supervision. A supervision with two principal
 * supervisors counted twice, and a supervision with none was omitted entirely. These metrics
 * count distinct supervisions; `powerBi` reproduces the old definition for the delta report.
 *
 * The Power BI model also carried three duplicated member tables to work around its inability to
 * resolve the many-to-many joins on this page (see the wiki). In SQL those are just joins, so
 * the duplicates are dropped rather than ported.
 */

/**
 * Institute scope + the page's year filter, on start_date.
 *
 * Power BI had two slicers here (Start Date and End Date); this ports the start one, which is
 * the useful cut -- an end-date filter would silently drop every ongoing supervision, which have
 * no end date at all.
 */
function supervisionWhere(
  instituteId: number,
  filters: MetricFilters
): Prisma.supervisionWhereInput {
  const where: Prisma.supervisionWhereInput = {
    ...instituteFilter.supervision(instituteId),
    ...pageYearWhere("start_date", filters),
  };

  const level = selected(filters, "supervision.level");
  if (level !== undefined) where.level_id = level as number | null;

  const faculty = selected(filters, "supervision.faculty");
  if (faculty !== undefined) where.faculty_id = faculty as number | null;

  return where;
}

export const supervisionsTotal = defineMetric({
  id: "supervisions.total",
  shape: "scalar",
  entity: "supervision",
  title: { en: "Total Supervisions", fr: "Supervisions au total" },
  run: async ({ instituteId, filters }) => ({
    value: await db.supervision.count({ where: supervisionWhere(instituteId, filters) }),
  }),
});

export const supervisionsByLevel = defineMetric({
  id: "supervisions.byLevel",
  shape: "breakdown",
  entity: "supervision",
  title: { en: "Supervisions by Level", fr: "Supervisions par niveau" },
  dimension: "supervision.level",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, levels] = await Promise.all([
      db.supervision.groupBy({
        by: ["level_id"],
        where: supervisionWhere(instituteId, filters),
        _count: { _all: true },
      }),
      db.level.findMany({ select: selectNames }),
    ]);
    return labelGroups(
      groups.map((g) => ({ key: g.level_id, count: g._count._all })),
      nameMap(levels, lang),
      lang
    );
  },
  powerBi: {
    note: "Counted principal-supervisor join rows: supervisions were multiplied by their principal supervisor count, and supervisions with no principal supervisor were omitted.",
    run: async ({ instituteId, filters, lang }) => {
      const [rows, levels] = await Promise.all([
        db.supervision_principal_supervisor.findMany({
          where: { supervision: supervisionWhere(instituteId, filters) },
          select: { supervision: { select: { level_id: true } } },
        }),
        db.level.findMany({ select: selectNames }),
      ]);
      return labelGroups(
        rows.map((r) => ({ key: r.supervision.level_id, count: 1 })),
        nameMap(levels, lang),
        lang
      );
    },
  },
});

export const supervisionsByFaculty = defineMetric({
  id: "supervisions.byFaculty",
  shape: "breakdown",
  entity: "supervision",
  title: { en: "Supervisions by Faculty", fr: "Supervisions par faculté" },
  dimension: "supervision.faculty",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, faculties] = await Promise.all([
      db.supervision.groupBy({
        by: ["faculty_id"],
        where: supervisionWhere(instituteId, filters),
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
  powerBi: {
    note: "Counted principal-supervisor join rows rather than supervisions.",
    run: async ({ instituteId, filters, lang }) => {
      const [rows, faculties] = await Promise.all([
        db.supervision_principal_supervisor.findMany({
          where: { supervision: supervisionWhere(instituteId, filters) },
          select: { supervision: { select: { faculty_id: true } } },
        }),
        db.faculty.findMany({ select: selectNames }),
      ]);
      return labelGroups(
        rows.map((r) => ({ key: r.supervision.faculty_id, count: 1 })),
        nameMap(faculties, lang),
        lang
      );
    },
  },
});

export const supervisionsList = defineMetric({
  id: "supervisions.list",
  shape: "rows",
  entity: "supervision",
  title: { en: "Supervisions", fr: "Supervisions" },
  run: async ({ instituteId, filters, lang }) => {
    const rows = await db.supervision.findMany({
      where: supervisionWhere(instituteId, filters),
      select: {
        id: true,
        first_name: true,
        last_name: true,
        start_date: true,
        end_date: true,
        note: true,
        level: { select: { name_en: true, name_fr: true } },
        supervision_principal_supervisor: {
          select: { member: { select: { account: { select: { first_name: true, last_name: true } } } } },
        },
        supervision_co_supervisor: {
          select: { member: { select: { account: { select: { first_name: true, last_name: true } } } } },
        },
      },
      orderBy: { start_date: "desc" },
    });

    const name = (a: { first_name: string; last_name: string }) =>
      `${a.first_name} ${a.last_name}`.trim();

    // Power BI needed a separate table per role here; a single joined row is equivalent and readable.
    return rows.map((r) => ({
      id: r.id,
      trainee: `${r.first_name} ${r.last_name}`.trim(),
      level: r.level ? (lang === "fr" ? r.level.name_fr : r.level.name_en) : null,
      principalSupervisors: r.supervision_principal_supervisor
        .map((s) => name(s.member.account))
        .join("; "),
      coSupervisors: r.supervision_co_supervisor.map((s) => name(s.member.account)).join("; "),
      startDate: r.start_date ? r.start_date.toISOString().slice(0, 10) : null,
      endDate: r.end_date ? r.end_date.toISOString().slice(0, 10) : null,
      note: r.note,
    }));
  },
});

export const supervisionMetrics = [
  supervisionsTotal,
  supervisionsByLevel,
  supervisionsByFaculty,
  supervisionsList,
];
