import type { Prisma } from "@prisma/client";
import db from "../../../prisma/prisma-client";
import { selected } from "./lib";
import { defineSuperMetric } from "./types";
import type { Lang, MetricFilters, SuperMetricContext } from "./types";

/**
 * Cross-institute metrics for the RIMS administrator portal.
 *
 * Scope: institute lifecycle and usage -- how many institutes exist, which are active, how much
 * each holds, and whether people are still signing in. Super admins administer instances and
 * create admin accounts; they are not readers of member data, so nothing here returns a person's
 * name, email, or record. Every figure is a count or an aggregate.
 *
 * What this CANNOT yet report: real activity telemetry -- logins over time, page views, who
 * edited what, when. RIMS records no audit events, so the closest available signal is
 * account.last_login (a single date, overwritten on each sign-in). That supports "how stale is
 * this institute's user base" but not "how heavily is it used". Proper usage reporting needs an
 * audit/event table; see reporting/README.md.
 */

/**
 * Buckets, in fixed display order, for how recently accounts last signed in.
 *
 * `key` is a stable identifier, NOT the label -- a cross-filter must survive the reader toggling
 * language, and "Over a year" / "Plus d'un an" are the same bucket.
 */
const LOGIN_BUCKETS = [
  { key: "last30", maxDays: 30, en: "Last 30 days", fr: "30 derniers jours" },
  { key: "d30to90", maxDays: 90, en: "30-90 days", fr: "30 à 90 jours" },
  { key: "d90to365", maxDays: 365, en: "90-365 days", fr: "90 à 365 jours" },
  { key: "overYear", maxDays: Infinity, en: "Over a year", fr: "Plus d'un an" },
] as const;
const NEVER = { key: "never", en: "Never", fr: "Jamais" } as const;

const bucketLabel = (b: { en: string; fr: string }, lang: Lang) => (lang === "fr" ? b.fr : b.en);

/** Which bucket an account's last_login falls in. */
function bucketOf(last_login: Date | null, now: number): string {
  if (!last_login) return NEVER.key;
  const days = (now - last_login.getTime()) / 86_400_000;
  return (LOGIN_BUCKETS.find((b) => days <= b.maxDays) ?? LOGIN_BUCKETS[LOGIN_BUCKETS.length - 1])
    .key;
}

/** The clock, injected once per request so every tile buckets against the same instant. */
const nowMs = () => Date.now();

/** Institute scope, when the reader has clicked one. */
const selectedInstitute = (filters: MetricFilters) =>
  selected(filters, "admin.institute") as number | undefined;

/** Login-recency scope, when the reader has clicked a bucket. */
const selectedBucket = (filters: MetricFilters) =>
  selected(filters, "admin.loginRecency") as string | undefined;

/**
 * An account predicate for the selected login bucket.
 *
 * Bucket boundaries are dates, so this is expressed as a date range rather than by re-bucketing
 * in JS -- the counts must agree with the chart that was clicked.
 */
function accountBucketWhere(filters: MetricFilters): Prisma.accountWhereInput {
  const key = selectedBucket(filters);
  if (key === undefined) return {};
  if (key === NEVER.key) return { last_login: null };

  const now = nowMs();
  const day = 86_400_000;
  const at = (days: number) => new Date(now - days * day);
  const index = LOGIN_BUCKETS.findIndex((b) => b.key === key);
  if (index === -1) return {};

  const upper = LOGIN_BUCKETS[index].maxDays; // days ago, inclusive
  const lower = index === 0 ? 0 : LOGIN_BUCKETS[index - 1].maxDays;

  return {
    last_login: {
      not: null,
      ...(Number.isFinite(upper) ? { gte: at(upper) } : {}),
      lte: at(lower),
    },
  };
}

/** Accounts in scope: the login bucket, plus the institute if one is selected. */
function accountWhere(filters: MetricFilters): Prisma.accountWhereInput {
  const where: Prisma.accountWhereInput = { ...accountBucketWhere(filters) };
  const instituteId = selectedInstitute(filters);
  if (instituteId !== undefined)
    where.member = { institutes: { some: { instituteId } } };
  return where;
}

export const institutesTotal = defineSuperMetric({
  id: "admin.institutesTotal",
  shape: "scalar",
  title: { en: "Institutes", fr: "Instituts" },
  run: async ({ filters }) => {
    const id = selectedInstitute(filters);
    return { value: await db.institute.count({ where: id !== undefined ? { id } : {} }) };
  },
});

export const institutesActive = defineSuperMetric({
  id: "admin.institutesActive",
  shape: "scalar",
  title: { en: "Active Institutes", fr: "Instituts actifs" },
  run: async ({ filters }) => {
    const id = selectedInstitute(filters);
    return {
      value: await db.institute.count({
        where: { is_active: true, ...(id !== undefined ? { id } : {}) },
      }),
    };
  },
});

export const accountsTotal = defineSuperMetric({
  id: "admin.accountsTotal",
  shape: "scalar",
  title: { en: "Accounts", fr: "Comptes" },
  run: async ({ filters }) => ({ value: await db.account.count({ where: accountWhere(filters) }) }),
});

export const membersTotal = defineSuperMetric({
  id: "admin.membersTotal",
  shape: "scalar",
  title: { en: "Members (all institutes)", fr: "Membres (tous les instituts)" },
  run: async ({ filters }) => {
    const instituteId = selectedInstitute(filters);
    const bucket = accountBucketWhere(filters);
    return {
      value: await db.member.count({
        where: {
          ...(instituteId !== undefined ? { institutes: { some: { instituteId } } } : {}),
          ...(Object.keys(bucket).length ? { account: bucket } : {}),
        },
      }),
    };
  },
});

/**
 * Members belonging to more than one institute.
 *
 * This is the number that says whether the shared-tenancy model is actually being used: if it is
 * zero, every institute is an island and the join tables are carrying no weight.
 */
export const sharedMembers = defineSuperMetric({
  id: "admin.sharedMembers",
  shape: "scalar",
  title: { en: "Members Shared Across Institutes", fr: "Membres partagés entre instituts" },
  run: async ({ filters }) => {
    const instituteId = selectedInstitute(filters);
    const rows = await db.memberInstitute.groupBy({ by: ["memberId"], _count: { _all: true } });
    const shared = new Set(rows.filter((r) => r._count._all > 1).map((r) => r.memberId));

    if (instituteId === undefined) return { value: shared.size };

    // With an institute selected: how many of ITS members are also in another institute.
    const mine = await db.memberInstitute.findMany({
      where: { instituteId },
      select: { memberId: true },
    });
    return { value: mine.filter((m) => shared.has(m.memberId)).length };
  },
});

/** Accounts that have never signed in -- the clearest signal of provisioned-but-unused seats. */
export const accountsNeverLoggedIn = defineSuperMetric({
  id: "admin.accountsNeverLoggedIn",
  shape: "scalar",
  title: { en: "Accounts Never Signed In", fr: "Comptes jamais connectés" },
  run: async ({ filters }) => {
    const instituteId = selectedInstitute(filters);
    return {
      value: await db.account.count({
        where: {
          last_login: null,
          ...(instituteId !== undefined
            ? { member: { institutes: { some: { instituteId } } } }
            : {}),
        },
      }),
    };
  },
});

export const accountsByLoginRecency = defineSuperMetric({
  id: "admin.accountsByLoginRecency",
  shape: "breakdown",
  title: { en: "Accounts by Last Sign-In", fr: "Comptes par dernière connexion" },
  dimension: "admin.loginRecency",
  run: async ({ filters, lang }) => {
    const instituteId = selectedInstitute(filters);
    const accounts = await db.account.findMany({
      where:
        instituteId !== undefined ? { member: { institutes: { some: { instituteId } } } } : {},
      select: { last_login: true },
    });

    const now = nowMs();
    const counts = new Map<string, number>();
    for (const a of accounts) {
      const key = bucketOf(a.last_login, now);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    // Fixed order, not sorted by value: these buckets are ordinal, and re-ranking them on every
    // refresh would make the chart unreadable.
    return [...LOGIN_BUCKETS, NEVER].map((b) => ({
      label: bucketLabel(b, lang),
      value: counts.get(b.key) ?? 0,
      key: b.key,
    }));
  },
});

/** Per-institute counts, gathered once and reused by the overview metrics below. */
async function instituteTallies(filters: MetricFilters) {
  const id = selectedInstitute(filters);
  const [institutes, members, products, organizations, grants, events, supervisions, admins] =
    await Promise.all([
      db.institute.findMany({
        where: id !== undefined ? { id } : {},
        select: { id: true, name: true, urlIdentifier: true, is_active: true },
        orderBy: { name: "asc" },
      }),
      db.memberInstitute.groupBy({ by: ["instituteId"], _count: { _all: true } }),
      db.productInstitute.groupBy({ by: ["instituteId"], _count: { _all: true } }),
      db.organizationInstitute.groupBy({ by: ["instituteId"], _count: { _all: true } }),
      db.grant.groupBy({ by: ["instituteId"], _count: { _all: true } }),
      db.event.groupBy({ by: ["instituteId"], _count: { _all: true } }),
      db.supervision.groupBy({ by: ["instituteId"], _count: { _all: true } }),
      db.instituteAdmin.groupBy({ by: ["instituteId"], _count: { _all: true } }),
    ]);

  const tally = (rows: { instituteId: number; _count: { _all: number } }[]) =>
    new Map(rows.map((r) => [r.instituteId, r._count._all]));

  const [m, p, o, g, e, s, a] = [
    members,
    products,
    organizations,
    grants,
    events,
    supervisions,
    admins,
  ].map(tally);

  return institutes.map((i) => ({
    ...i,
    admins: a.get(i.id) ?? 0,
    members: m.get(i.id) ?? 0,
    products: p.get(i.id) ?? 0,
    organizations: o.get(i.id) ?? 0,
    grants: g.get(i.id) ?? 0,
    events: e.get(i.id) ?? 0,
    supervisions: s.get(i.id) ?? 0,
  }));
}

export const institutesByMembers = defineSuperMetric({
  id: "admin.institutesByMembers",
  shape: "breakdown",
  title: { en: "Members by Institute", fr: "Membres par institut" },
  dimension: "admin.institute",
  run: async ({ filters, lang }) => {
    const rows = await instituteTallies(filters);
    // An institute's name is a proper noun, not a translatable label -- one `name` column.
    return rows
      .map((r) => ({ label: r.name, value: r.members, key: r.id }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, lang));
  },
});

export const institutesByContent = defineSuperMetric({
  id: "admin.institutesByContent",
  shape: "breakdown",
  title: { en: "Records by Institute", fr: "Enregistrements par institut" },
  dimension: "admin.institute",
  run: async ({ filters, lang }) => {
    const rows = await instituteTallies(filters);
    return rows
      .map((r) => ({
        label: r.name,
        value: r.products + r.organizations + r.grants + r.events + r.supervisions,
        key: r.id,
      }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, lang));
  },
});

/** An institute holding no records at all -- provisioned but never populated. */
export const institutesEmpty = defineSuperMetric({
  id: "admin.institutesEmpty",
  shape: "scalar",
  title: { en: "Institutes With No Records", fr: "Instituts sans enregistrements" },
  run: async ({ filters }) => {
    const rows = await instituteTallies(filters);
    return {
      value: rows.filter(
        (r) => r.products + r.organizations + r.grants + r.events + r.supervisions === 0
      ).length,
    };
  },
});

export const institutesOverview = defineSuperMetric({
  id: "admin.institutesOverview",
  shape: "rows",
  title: { en: "Institutes", fr: "Instituts" },
  run: async ({ filters, lang }) => {
    const rows = await instituteTallies(filters);
    const status = (active: boolean) =>
      lang === "fr" ? (active ? "Actif" : "Inactif") : active ? "Active" : "Inactive";
    return rows.map((r) => ({
      institute: r.name,
      url: r.urlIdentifier,
      status: status(r.is_active),
      admins: r.admins,
      members: r.members,
      products: r.products,
      partners: r.organizations,
      grants: r.grants,
      events: r.events,
      supervisions: r.supervisions,
    }));
  },
});

export const adminMetrics = [
  institutesTotal,
  institutesActive,
  institutesEmpty,
  accountsTotal,
  membersTotal,
  sharedMembers,
  accountsNeverLoggedIn,
  accountsByLoginRecency,
  institutesByMembers,
  institutesByContent,
  institutesOverview,
];

const byId = new Map<string, (typeof adminMetrics)[number]>();
for (const metric of adminMetrics) {
  if (byId.has(metric.id)) throw new Error(`Duplicate super metric id: ${metric.id}`);
  byId.set(metric.id, metric);
}

export const superMetricRegistry: ReadonlyMap<string, (typeof adminMetrics)[number]> = byId;

export function getSuperMetric(id: string) {
  return byId.get(id);
}
