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
import type { Lang, MetricContext, MetricFilters } from "./types";

/** peer_reviewed is a boolean column, not a lookup table, so its labels live here. */
const peerLabel = (peer: boolean, lang: Lang) =>
  lang === "fr"
    ? peer
      ? "Évalué par les pairs"
      : "Non évalué par les pairs"
    : peer
    ? "Peer Reviewed"
    : "Not Peer Reviewed";

/**
 * Products page metrics (ported from the 2024 Power BI dashboard, counts corrected).
 *
 * Every product figure in the Power BI dashboard was bound to product_member_author.product_id
 * -- a row in the author join table, not a product. That means the published numbers:
 *
 *   - counted a product once per *registered member author* (a paper with 3 registered
 *     co-authors counted 3 times), and
 *   - silently dropped every product with no registered member author (external-only authors
 *     recorded in product.all_author contributed nothing).
 *
 * These metrics count distinct products. The `powerBi` variant on each reproduces the old
 * definition so the parity harness can report exactly what each published figure moves by.
 */

/** Cross-filters from clicked marks, as a product predicate. */
function productSelections(filters: MetricFilters): Prisma.productWhereInput {
  const where: Prisma.productWhereInput = {};

  const type = selected(filters, "product.type");
  if (type !== undefined) where.product_type_id = type as number | null;

  const peer = selected(filters, "product.peerReviewed");
  if (peer !== undefined) where.peer_reviewed = Boolean(peer);

  const topic = selected(filters, "product.topic");
  // A topic lives on a join table, so selecting one is an existence test, not an equality.
  if (topic !== undefined)
    where.product_topic =
      topic === null ? { none: {} } : { some: { topic_id: topic as number } };

  return where;
}

/**
 * Institute scope + the page's year filter (publish_date, "Publish Year" in Power BI) + any
 * cross-filters from clicked marks.
 *
 * Every tile on the page goes through this: a page filter that moved only the by-year chart
 * would be worse than no filter at all, because the other tiles would look like they agreed with
 * it.
 */
function productWhere(instituteId: number, filters: MetricFilters): Prisma.productWhereInput {
  return {
    ...instituteFilter.product(instituteId),
    ...pageYearWhere("publish_date", filters),
    ...productSelections(filters),
  };
}

/** The Power BI binding: one row per (product, registered author) pair, within the page scope. */
function authorPairsWhere(ctx: MetricContext) {
  return { product: productWhere(ctx.instituteId, ctx.filters) };
}

async function authorPairProducts(ctx: MetricContext) {
  const rows = await db.product_member_author.findMany({
    where: authorPairsWhere(ctx),
    select: {
      product: {
        select: { peer_reviewed: true, product_type_id: true, publish_date: true },
      },
    },
  });
  return rows.map((r) => r.product);
}

export const productsTotal = defineMetric({
  id: "products.total",
  shape: "scalar",
  entity: "product",
  title: { en: "Total Products", fr: "Produits au total" },
  run: async ({ instituteId, filters }) => ({
    value: await db.product.count({ where: productWhere(instituteId, filters) }),
  }),
  powerBi: {
    note: "Counted product_member_author rows: products were multiplied by their registered author count, and products with no registered author were omitted.",
    // Summed from the product side on purpose. Prisma 4 cannot run count() with a relation
    // filter against a composite-primary-key model on SQL Server -- it emits a tuple IN that
    // the server rejects (error 4145). Filtering by an explicit product_id list would work but
    // would hit SQL Server's ~2100 parameter cap on a large institute.
    run: async ({ instituteId, filters }) => {
      const products = await db.product.findMany({
        where: productWhere(instituteId, filters),
        select: { _count: { select: { product_member_author: true } } },
      });
      return {
        value: products.reduce((sum, p) => sum + p._count.product_member_author, 0),
      };
    },
  },
});

export const productsByPeerReviewed = defineMetric({
  id: "products.byPeerReviewed",
  shape: "breakdown",
  entity: "product",
  title: { en: "Products by Peer Review", fr: "Produits par évaluation par les pairs" },
  dimension: "product.peerReviewed",
  run: async ({ instituteId, filters, lang }) => {
    const groups = await db.product.groupBy({
      by: ["peer_reviewed"],
      where: productWhere(instituteId, filters),
      _count: { _all: true },
    });
    return groups
      .map((g) => ({
        label: peerLabel(g.peer_reviewed, lang),
        value: g._count._all,
        key: g.peer_reviewed,
      }))
      .sort((a, b) => b.value - a.value);
  },
  powerBi: {
    note: "Counted author pairs rather than products.",
    run: async (ctx) => {
      const products = await authorPairProducts(ctx);
      const counts = new Map<string, number>();
      for (const p of products) {
        const label = peerLabel(p.peer_reviewed, ctx.lang);
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
    },
  },
});

export const productsByType = defineMetric({
  id: "products.byType",
  shape: "breakdown",
  entity: "product",
  title: { en: "Products by Type", fr: "Produits par type" },
  dimension: "product.type",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, types] = await Promise.all([
      db.product.groupBy({
        by: ["product_type_id"],
        where: productWhere(instituteId, filters),
        _count: { _all: true },
      }),
      db.product_type.findMany({ select: selectNames }),
    ]);
    return labelGroups(
      groups.map((g) => ({ key: g.product_type_id, count: g._count._all })),
      nameMap(types, lang),
      lang
    );
  },
  powerBi: {
    note: "Counted author pairs rather than products.",
    run: async (ctx) => {
      const [products, types] = await Promise.all([
        authorPairProducts(ctx),
        db.product_type.findMany({ select: selectNames }),
      ]);
      return labelGroups(
        products.map((p) => ({ key: p.product_type_id, count: 1 })),
        nameMap(types, ctx.lang),
        ctx.lang
      );
    },
  },
});

export const productsByTopic = defineMetric({
  id: "products.byTopic",
  shape: "breakdown",
  entity: "product",
  title: { en: "Products by Topic", fr: "Produits par sujet" },
  dimension: "product.topic",
  run: async ({ instituteId, filters, lang }) => {
    const [groups, topics] = await Promise.all([
      db.product_topic.groupBy({
        by: ["topic_id"],
        where: { product: productWhere(instituteId, filters) },
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
  powerBi: {
    note: "Counted author pairs per topic, so a topic's products were multiplied by their registered author counts.",
    run: async ({ instituteId, filters, lang }) => {
      const [rows, topics] = await Promise.all([
        db.product_topic.findMany({
          where: { product: productWhere(instituteId, filters) },
          select: {
            topic_id: true,
            product: { select: { _count: { select: { product_member_author: true } } } },
          },
        }),
        db.topic.findMany({ select: selectNames }),
      ]);
      return labelGroups(
        rows.map((r) => ({
          key: r.topic_id,
          count: r.product._count.product_member_author,
        })),
        nameMap(topics, lang),
        lang
      );
    },
  },
});

export const productsByPublishYear = defineMetric({
  id: "products.byPublishYear",
  shape: "series",
  entity: "product",
  title: { en: "Products by Publish Year", fr: "Produits par année de publication" },
  run: async ({ instituteId, filters }) => {
    const rows = await db.product.findMany({
      where: productWhere(instituteId, filters),
      select: { publish_date: true },
    });
    return toYearSeries(
      rows.map((r) => r.publish_date),
      filters
    );
  },
  powerBi: {
    note: "Counted author pairs per publish year rather than products.",
    run: async (ctx) => {
      const products = await authorPairProducts(ctx);
      return toYearSeries(
        products.map((p) => p.publish_date),
        ctx.filters
      );
    },
  },
});

export const productsList = defineMetric({
  id: "products.list",
  shape: "rows",
  entity: "product",
  title: { en: "Products", fr: "Produits" },
  run: async ({ instituteId, filters, lang }) => {
    const rows = await db.product.findMany({
      where: productWhere(instituteId, filters),
      select: { id: true, title_en: true, title_fr: true, all_author: true, publish_date: true },
      orderBy: { publish_date: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      title: lang === "fr" ? r.title_fr : r.title_en,
      authors: r.all_author,
      published: r.publish_date ? r.publish_date.toISOString().slice(0, 10) : null,
    }));
  },
});

export const productsRegisteredAuthors = defineMetric({
  id: "products.registeredAuthors",
  shape: "rows",
  entity: "product",
  title: { en: "Registered Authors", fr: "Auteurs inscrits" },
  run: async (ctx: MetricContext) => {
    const rows = await db.product_member_author.findMany({
      where: authorPairsWhere(ctx),
      select: {
        member_id: true,
        member: { select: { account: { select: { first_name: true, last_name: true } } } },
      },
    });
    const counts = new Map<number, { name: string; products: number }>();
    for (const r of rows) {
      const name =
        `${r.member.account.first_name} ${r.member.account.last_name}`.trim() ||
        blankLabel(ctx.lang);
      const existing = counts.get(r.member_id);
      counts.set(r.member_id, { name, products: (existing?.products ?? 0) + 1 });
    }
    return [...counts.entries()]
      .map(([memberId, v]) => ({ memberId, author: v.name, products: v.products }))
      .sort((a, b) => b.products - a.products || a.author.localeCompare(b.author));
  },
});

export const productMetrics = [
  productsTotal,
  productsByPeerReviewed,
  productsByType,
  productsByTopic,
  productsByPublishYear,
  productsList,
  productsRegisteredAuthors,
];
