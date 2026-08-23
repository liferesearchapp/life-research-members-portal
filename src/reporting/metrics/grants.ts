import type { Prisma } from "@prisma/client";
import db from "../../../prisma/prisma-client";
import { labelGroups, nameMap, pageYearWhere, selectNames, selected, toYearSeries } from "./lib";
import { instituteFilter } from "./tenant";
import { defineMetric } from "./types";
import type { MetricFilters } from "./types";

/**
 * Grants page metrics (ported from the 2024 Power BI dashboard, counts corrected).
 *
 * The source donut was bound to grant_member_involved.grant_id -- a row in the involved-member
 * join table, not a grant -- so grants were multiplied by their involved-member count and grants
 * with no involved member were omitted. The status bar chart was bound to grant.id and needed no
 * correction. `powerBi` variants reproduce the old definitions for the delta report.
 */

/**
 * Institute scope + the page's year filter, which is on obtained_date ("Grant Obtained Year" in
 * Power BI). Every tile on the page goes through this, so the figures always agree with the
 * control above them.
 *
 * Setting a year therefore also drops grants that were never obtained (obtained_date NULL) --
 * submitted-but-unfunded grants leave the page. That is what the Power BI slicer did, and it is
 * why the control is labelled "Obtained Year" rather than just "Years".
 */
function grantWhere(instituteId: number, filters: MetricFilters): Prisma.grantWhereInput {
  const where: Prisma.grantWhereInput = {
    ...instituteFilter.grant(instituteId),
    ...pageYearWhere("obtained_date", filters),
  };

  const source = selected(filters, "grant.source");
  if (source !== undefined) where.source_id = source as number | null;

  const status = selected(filters, "grant.status");
  if (status !== undefined) where.status_id = status as number | null;

  return where;
}

export const grantsTotal = defineMetric({
  id: "grants.total",
  shape: "scalar",
  entity: "grant",
  title: { en: "Total Grants", fr: "Subventions au total" },
  run: async ({ instituteId, filters }) => ({
    value: await db.grant.count({ where: grantWhere(instituteId, filters) }),
  }),
});

export const grantsTotalAmount = defineMetric({
  id: "grants.totalAmount",
  shape: "scalar",
  entity: "grant",
  title: { en: "Total Grant Amount", fr: "Montant total des subventions" },
  run: async ({ instituteId, filters }) => {
    const agg = await db.grant.aggregate({
      where: grantWhere(instituteId, filters),
      _sum: { amount: true },
    });
    return { value: agg._sum.amount ?? 0 };
  },
});

export const grantsBySource = defineMetric({
  id: "grants.bySource",
  shape: "breakdown",
  entity: "grant",
  title: { en: "Grants by Source", fr: "Subventions par source" },
  dimension: "grant.source",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, sources] = await Promise.all([
      db.grant.groupBy({
        by: ["source_id"],
        where: grantWhere(instituteId, filters),
        _count: { _all: true },
      }),
      db.source.findMany({ select: selectNames }),
    ]);
    return labelGroups(
      groups.map((g) => ({ key: g.source_id, count: g._count._all })),
      nameMap(sources, lang),
      lang
    );
  },
  powerBi: {
    note: "Counted involved-member join rows: grants were multiplied by their involved-member count, and grants with no involved member were omitted.",
    run: async ({ instituteId, filters, lang }) => {
      const [rows, sources] = await Promise.all([
        db.grant_member_involved.findMany({
          where: { grant: grantWhere(instituteId, filters) },
          select: { grant: { select: { source_id: true } } },
        }),
        db.source.findMany({ select: selectNames }),
      ]);
      return labelGroups(
        rows.map((r) => ({ key: r.grant.source_id, count: 1 })),
        nameMap(sources, lang),
        lang
      );
    },
  },
});

export const grantsByStatus = defineMetric({
  id: "grants.byStatus",
  shape: "breakdown",
  entity: "grant",
  title: { en: "Grants by Status", fr: "Subventions par statut" },
  dimension: "grant.status",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, statuses] = await Promise.all([
      db.grant.groupBy({
        by: ["status_id"],
        where: grantWhere(instituteId, filters),
        _count: { _all: true },
      }),
      db.status.findMany({ select: selectNames }),
    ]);
    return labelGroups(
      groups.map((g) => ({ key: g.status_id, count: g._count._all })),
      nameMap(statuses, lang),
      lang
    );
  },
});

export const grantsByObtainedYear = defineMetric({
  id: "grants.byObtainedYear",
  shape: "series",
  entity: "grant",
  title: { en: "Grants by Obtained Year", fr: "Subventions par année d'obtention" },
  run: async ({ instituteId, filters }) => {
    const rows = await db.grant.findMany({
      where: grantWhere(instituteId, filters),
      select: { obtained_date: true },
    });
    return toYearSeries(
      rows.map((r) => r.obtained_date),
      filters
    );
  },
});

/**
 * INFERRED -- not ported from the original DAX.
 *
 * The Power BI cards bound bare measures (grant.Submission_date_calculated,
 * Obtained_date_calculated, Completed_date_calculated), and the DAX lives in the pbix DataModel,
 * which is XPress9-compressed and unreadable without Power BI Desktop. The user described them
 * as filters partitioning the by-source donut, so the reading taken here is "grants that reached
 * this milestone" -- a non-null milestone date.
 *
 * These sit inside the page's obtained-year scope like every other tile, then count non-null
 * milestone dates within it. So with a year set, "Grants Submitted" means "grants obtained in
 * this range that also carry a submission date" -- consistent with the page label, though it
 * makes the submitted and obtained cards converge on the total. Worth revisiting if the real
 * DAX ever surfaces.
 */
function grantMilestoneCount(
  id: string,
  column: "submission_date" | "obtained_date" | "completed_date",
  title: { en: string; fr: string }
) {
  return defineMetric({
    id,
    shape: "scalar",
    entity: "grant",
    title,
    run: async ({ instituteId, filters }) => ({
      value: await db.grant.count({
        where: { ...grantWhere(instituteId, filters), [column]: { not: null } },
      }),
    }),
  });
}

export const grantsSubmittedCount = grantMilestoneCount("grants.submittedCount", "submission_date", {
  en: "Grants Submitted",
  fr: "Subventions soumises",
});
export const grantsObtainedCount = grantMilestoneCount("grants.obtainedCount", "obtained_date", {
  en: "Grants Obtained",
  fr: "Subventions obtenues",
});
export const grantsCompletedCount = grantMilestoneCount("grants.completedCount", "completed_date", {
  en: "Grants Completed",
  fr: "Subventions terminées",
});

export const grantsList = defineMetric({
  id: "grants.list",
  shape: "rows",
  entity: "grant",
  title: { en: "All Grants", fr: "Toutes les subventions" },
  run: async ({ instituteId, filters, lang }) => {
    const rows = await db.grant.findMany({
      where: grantWhere(instituteId, filters),
      select: {
        id: true,
        title: true,
        amount: true,
        all_investigator: true,
        obtained_date: true,
        status: { select: { name_en: true, name_fr: true } },
        source: { select: { name_en: true, name_fr: true } },
      },
      orderBy: { obtained_date: "desc" },
    });
    const name = (r: { name_en: string; name_fr: string } | null) =>
      r ? (lang === "fr" ? r.name_fr : r.name_en) : null;
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      amount: r.amount,
      status: name(r.status),
      source: name(r.source),
      investigators: r.all_investigator,
      obtained: r.obtained_date ? r.obtained_date.toISOString().slice(0, 10) : null,
    }));
  },
});

export const grantsFromEvents = defineMetric({
  id: "grants.fromEvents",
  shape: "rows",
  entity: "grant",
  title: { en: "Events and Resulted Grants", fr: "Événements et subventions résultantes" },
  run: async ({ instituteId, filters, lang }) => {
    const rows = await db.event_grant_resulted.findMany({
      where: { grant: grantWhere(instituteId, filters) },
      select: {
        event: { select: { name_en: true, name_fr: true } },
        grant: { select: { title: true, amount: true } },
      },
    });
    return rows
      .map((r) => ({
        event: lang === "fr" ? r.event.name_fr : r.event.name_en,
        // grant.title is a single column -- RIMS stores no French grant title.
        grant: r.grant.title,
        amount: r.grant.amount,
      }))
      .sort(
        (a, b) => a.event.localeCompare(b.event, lang) || a.grant.localeCompare(b.grant, lang)
      );
  },
});

export const grantMetrics = [
  grantsTotal,
  grantsTotalAmount,
  grantsBySource,
  grantsByStatus,
  grantsByObtainedYear,
  grantsSubmittedCount,
  grantsObtainedCount,
  grantsCompletedCount,
  grantsList,
  grantsFromEvents,
];
