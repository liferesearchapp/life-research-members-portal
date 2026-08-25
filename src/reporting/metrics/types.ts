import type { TenantedEntity } from "./tenant";

export type Bilingual = { en: string; fr: string };

/**
 * A clickable dimension.
 *
 * Naming a metric's dimension is what makes cross-filtering possible: clicking a donut slice
 * has to become a database predicate, and a display label ("Faculty of Science") is not one.
 * The metric declares which dimension it groups by; its rows carry the key; the entity's
 * scope helper turns {dimension, key} back into a `where` clause.
 */
export type DimensionId =
  | "member.type"
  | "member.faculty"
  | "member.location"
  | "organization.scope"
  | "organization.type"
  | "product.type"
  | "product.topic"
  | "product.peerReviewed"
  | "grant.source"
  | "grant.status"
  | "supervision.level"
  | "supervision.faculty"
  | "event.type"
  | "event.topic"
  // Cross-institute (admin report) dimensions.
  | "admin.institute"
  | "admin.loginRecency";

/**
 * One active cross-filter, e.g. "product.type = 3 (Journal Article)".
 *
 * `key` is the database value, not the label -- null means the grouped column was NULL (the
 * "(Blank)" slice), which is a real selection and must round-trip as `IS NULL`.
 */
/** The database value behind a selectable mark. Booleans are real keys (peer reviewed yes/no). */
export type SelectionKey = string | number | boolean | null;

export type Selection = {
  dimension: DimensionId;
  key: SelectionKey;
  /** Display text, carried so the filter chip can be drawn without a second lookup. */
  label: string;
};

/** Filters a report page can apply to its tiles (the Power BI "slicers" + cross-filtering). */
export type MetricFilters = {
  /** Inclusive year range applied to the entity's natural date column, when it has one. */
  yearFrom?: number;
  yearTo?: number;
  /** Cross-filters from clicked marks. ANDed together. */
  selections?: Selection[];
};

export type Lang = "en" | "fr";

export type MetricContext = {
  instituteId: number;
  filters: MetricFilters;
  /**
   * Which language to label rows in.
   *
   * Every lookup table in RIMS carries name_en AND name_fr, so a French reader must see
   * "Professeur titulaire", not "Full Professor". Labels are built server-side (that is where the
   * lookup query lives), so the language has to travel with the request rather than being applied
   * in the browser.
   */
  lang: Lang;
};

export type ScalarValue = { value: number };
/** `key` is the database value behind the label; present when the metric declares a dimension. */
export type BreakdownRow = { label: string; value: number; key?: SelectionKey };
export type SeriesPoint = { period: string; value: number };
export type TableRow = Record<string, string | number | null>;

export type MetricShape = "scalar" | "breakdown" | "series" | "rows";

export type MetricResultFor<S extends MetricShape> = S extends "scalar"
  ? ScalarValue
  : S extends "breakdown"
  ? BreakdownRow[]
  : S extends "series"
  ? SeriesPoint[]
  : TableRow[];

export type Metric<S extends MetricShape = MetricShape> = {
  id: string;
  shape: S;
  entity: TenantedEntity;
  title: Bilingual;
  /**
   * What this metric groups by. Set it to make the tile clickable: the engine turns a click on
   * a mark into a Selection on this dimension. Omit for tiles that should not cross-filter.
   */
  dimension?: DimensionId;
  run: (ctx: MetricContext) => Promise<MetricResultFor<S>>;
  /**
   * How the 2024 Power BI dashboard computed the same figure, where it differed.
   *
   * Present only on metrics whose definition was deliberately corrected during the port. The
   * parity harness runs both and reports the delta, so a changed published number is a
   * reviewable fact rather than a surprise.
   */
  powerBi?: {
    /** Why the old figure differed, in one line, for the delta report. */
    note: string;
    run: (ctx: MetricContext) => Promise<MetricResultFor<S>>;
  };
};

export function defineMetric<S extends MetricShape>(m: Metric<S>): Metric<S> {
  return m;
}

/**
 * Cross-institute (RIMS administrator) metrics.
 *
 * Deliberately a separate type with no instituteId: these run across every institute, and the
 * type system is the cheapest place to guarantee they can never be confused with the
 * institute-scoped metrics above, or accidentally served from the institute endpoint.
 *
 * Super admins administer RIMS instances and monitor usage; they are not readers of member
 * data. So a SuperMetric must only ever return counts and aggregates -- never a person's name,
 * email, or record. Anything that would identify an individual belongs in the institute report,
 * behind that institute's own admins.
 */
export type SuperMetricContext = { filters: MetricFilters; lang: Lang };

export type SuperMetric<S extends MetricShape = MetricShape> = {
  id: string;
  shape: S;
  title: Bilingual;
  /** Set to make the tile clickable for cross-filtering. See Metric.dimension. */
  dimension?: DimensionId;
  run: (ctx: SuperMetricContext) => Promise<MetricResultFor<S>>;
};

export function defineSuperMetric<S extends MetricShape>(m: SuperMetric<S>): SuperMetric<S> {
  return m;
}
