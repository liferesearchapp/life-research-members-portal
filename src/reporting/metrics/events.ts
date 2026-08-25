import type { Prisma } from "@prisma/client";
import db from "../../../prisma/prisma-client";
import { labelGroups, nameMap, pageYearWhere, selectNames, selected, toYearSeries } from "./lib";
import { instituteFilter } from "./tenant";
import { defineMetric } from "./types";
import type { Lang, MetricFilters } from "./types";

/**
 * Events page metrics (ported from the 2024 Power BI dashboard).
 *
 * Counts needed no correction: the Power BI event figures were bound to event.id, and the
 * by-topic card to event_topic.event_id, which is already one row per (event, topic) pair.
 * Only the institute filter is new -- events are an *owned* entity, so it is a column comparison.
 */

/** Events carry their own bilingual name, not just their lookups. */
const eventName = (e: { name_en: string; name_fr: string }, lang: Lang) =>
  lang === "fr" ? e.name_fr : e.name_en;

/**
 * Institute scope + the page's year filter (start_date, "Event Start Year" in Power BI) + any
 * cross-filters from clicked marks. Every tile on the page goes through this.
 */
function eventWhere(instituteId: number, filters: MetricFilters): Prisma.eventWhereInput {
  const where: Prisma.eventWhereInput = {
    ...instituteFilter.event(instituteId),
    ...pageYearWhere("start_date", filters),
  };

  const type = selected(filters, "event.type");
  if (type !== undefined) where.event_type_id = type as number | null;

  const topic = selected(filters, "event.topic");
  // Events carry topics on a join table, so a selection is an existence test.
  if (topic !== undefined)
    where.event_topic = topic === null ? { none: {} } : { some: { topic_id: topic as number } };

  return where;
}

export const eventsTotal = defineMetric({
  id: "events.total",
  shape: "scalar",
  entity: "event",
  title: { en: "Total Events", fr: "Événements au total" },
  run: async ({ instituteId, filters }) => ({
    value: await db.event.count({ where: eventWhere(instituteId, filters) }),
  }),
});

export const eventsByType = defineMetric({
  id: "events.byType",
  shape: "breakdown",
  entity: "event",
  title: { en: "Events by Type", fr: "Événements par type" },
  dimension: "event.type",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, types] = await Promise.all([
      db.event.groupBy({
        by: ["event_type_id"],
        where: eventWhere(instituteId, filters),
        _count: { _all: true },
      }),
      db.event_type.findMany({ select: selectNames }),
    ]);
    return labelGroups(
      groups.map((g) => ({ key: g.event_type_id, count: g._count._all })),
      nameMap(types, lang),
      lang
    );
  },
});

export const eventsByTopic = defineMetric({
  id: "events.byTopic",
  shape: "breakdown",
  entity: "event",
  title: { en: "Events by Topic", fr: "Événements par sujet" },
  dimension: "event.topic",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, topics] = await Promise.all([
      db.event_topic.groupBy({
        by: ["topic_id"],
        where: { event: eventWhere(instituteId, filters) },
        _count: { _all: true },
      }),
      db.topic.findMany({ select: selectNames }),
    ]);
    return labelGroups(
      groups.map((g) => ({ key: g.topic_id, count: g._count._all })),
      nameMap(topics, lang),
      lang
    );
  },
});

export const eventsByStartYear = defineMetric({
  id: "events.byStartYear",
  shape: "series",
  entity: "event",
  title: { en: "Events by Start Year", fr: "Événements par année de début" },
  run: async ({ instituteId, filters }) => {
    const rows = await db.event.findMany({
      where: eventWhere(instituteId, filters),
      select: { start_date: true },
    });
    return toYearSeries(
      rows.map((r) => r.start_date),
      filters
    );
  },
});

export const eventsList = defineMetric({
  id: "events.list",
  shape: "rows",
  entity: "event",
  title: { en: "Events", fr: "Événements" },
  run: async ({ instituteId, filters, lang }) => {
    const rows = await db.event.findMany({
      where: eventWhere(instituteId, filters),
      select: {
        id: true,
        name_en: true,
        name_fr: true,
        start_date: true,
        end_date: true,
        note: true,
        event_type: { select: { name_en: true, name_fr: true } },
      },
      orderBy: { start_date: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: eventName(r, lang),
      type: r.event_type ? eventName(r.event_type, lang) : null,
      // The Power BI "Notes" table bound a bare event.Notes_calculated measure whose DAX is not
      // recoverable from the compressed DataModel. The underlying note column is carried here;
      // confirm whether the old measure did any cleaning/concatenation beyond this.
      note: r.note,
      startDate: r.start_date ? r.start_date.toISOString().slice(0, 10) : null,
      endDate: r.end_date ? r.end_date.toISOString().slice(0, 10) : null,
    }));
  },
});

export const eventsPartnersInvolved = defineMetric({
  id: "events.partnersInvolved",
  shape: "rows",
  entity: "event",
  title: { en: "Partners Involved", fr: "Partenaires impliqués" },
  run: async ({ instituteId, filters, lang }) => {
    const rows = await db.event_partner_involved.findMany({
      where: { event: eventWhere(instituteId, filters) },
      select: {
        event: { select: { name_en: true, name_fr: true } },
        organization: { select: { id: true, name_en: true, name_fr: true } },
      },
    });
    return rows
      .map((r) => ({
        event: eventName(r.event, lang),
        organizationId: r.organization.id,
        organization: eventName(r.organization, lang),
      }))
      .sort(
        (a, b) =>
          a.event.localeCompare(b.event, lang) || a.organization.localeCompare(b.organization, lang)
      );
  },
});

export const eventsProductsResulted = defineMetric({
  id: "events.productsResulted",
  shape: "rows",
  entity: "event",
  title: { en: "Resulted Products", fr: "Produits résultants" },
  run: async ({ instituteId, filters, lang }) => {
    const rows = await db.event_product_resulted.findMany({
      where: { event: eventWhere(instituteId, filters) },
      select: {
        event: { select: { name_en: true, name_fr: true } },
        product: { select: { id: true, title_en: true, title_fr: true } },
      },
    });
    return rows
      .map((r) => ({
        event: eventName(r.event, lang),
        productId: r.product.id,
        product: lang === "fr" ? r.product.title_fr : r.product.title_en,
      }))
      .sort(
        (a, b) => a.event.localeCompare(b.event, lang) || a.product.localeCompare(b.product, lang)
      );
  },
});

export const eventsMembersInvolved = defineMetric({
  id: "events.membersInvolved",
  shape: "rows",
  entity: "event",
  title: { en: "Members Involved", fr: "Membres impliqués" },
  run: async ({ instituteId, filters, lang }) => {
    const rows = await db.event_member_involved.findMany({
      where: { event: eventWhere(instituteId, filters) },
      select: {
        event: { select: { name_en: true, name_fr: true } },
        member: {
          select: { id: true, account: { select: { first_name: true, last_name: true } } },
        },
      },
    });
    return rows
      .map((r) => ({
        event: eventName(r.event, lang),
        memberId: r.member.id,
        // A person's name is not translated.
        member: `${r.member.account.first_name} ${r.member.account.last_name}`.trim(),
      }))
      .sort(
        (a, b) => a.event.localeCompare(b.event, lang) || a.member.localeCompare(b.member, lang)
      );
  },
});

export const eventMetrics = [
  eventsTotal,
  eventsByType,
  eventsByTopic,
  eventsByStartYear,
  eventsList,
  eventsPartnersInvolved,
  eventsProductsResulted,
  eventsMembersInvolved,
];
