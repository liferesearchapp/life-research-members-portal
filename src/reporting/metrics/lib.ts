import type {
  BreakdownRow,
  DimensionId,
  Lang,
  MetricFilters,
  SelectionKey,
  SeriesPoint,
} from "./types";

/** Label used where a grouped dimension is null (Power BI rendered these as "(Blank)"). */
export const blankLabel = (lang: Lang) => (lang === "fr" ? "(Vide)" : "(Blank)");

/**
 * Builds an id -> display name map in the reader's language.
 *
 * Every RIMS lookup table carries both names, so always select name_en AND name_fr and let this
 * choose. Reaching for name_en directly is the bug this exists to prevent.
 */
export function nameMap<T extends { id: number; name_en: string; name_fr: string }>(
  rows: T[],
  lang: Lang
): Map<number, string> {
  return new Map(rows.map((r) => [r.id, lang === "fr" ? r.name_fr : r.name_en]));
}

/** Selects both names from a lookup table. Use everywhere a label is needed. */
export const selectNames = { id: true, name_en: true, name_fr: true } as const;

/**
 * Buckets dated rows into a per-year series.
 *
 * Done in JS rather than SQL because Prisma 4 cannot group by a computed YEAR(), and the
 * volumes here are institute-scale (hundreds to low thousands of rows), so pulling the dates
 * is cheaper than maintaining raw SQL per dialect. Revisit if a metric ever exceeds ~50k rows.
 */
export function toYearSeries(dates: (Date | null)[], filters: MetricFilters): SeriesPoint[] {
  const counts = new Map<number, number>();

  for (const date of dates) {
    if (!date) continue; // Power BI's CountNonNull excluded undated rows; so do we.
    const year = date.getUTCFullYear();
    if (filters.yearFrom !== undefined && year < filters.yearFrom) continue;
    if (filters.yearTo !== undefined && year > filters.yearTo) continue;
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, value]) => ({ period: String(year), value }));
}

/** Restricts a date column to the page's year filter, as a Prisma date range. */
export function yearRangeFilter(filters: MetricFilters): { gte?: Date; lte?: Date } | undefined {
  const range: { gte?: Date; lte?: Date } = {};
  if (filters.yearFrom !== undefined) range.gte = new Date(Date.UTC(filters.yearFrom, 0, 1));
  if (filters.yearTo !== undefined) range.lte = new Date(Date.UTC(filters.yearTo, 11, 31));
  return range.gte || range.lte ? range : undefined;
}

/**
 * The page year filter, as a clause to spread into an entity's `where`.
 *
 * A page's year control scopes every tile on that page, on one natural date column. Returns `{}`
 * when unfiltered, so callers can spread it unconditionally.
 *
 * Note that filtering a date column also drops rows where it is NULL -- a product with no
 * publish date disappears once a year range is set. That matches the Power BI slicers, which
 * excluded blanks the moment a year was chosen, and it is why the control is labelled with the
 * column it cuts.
 */
export function pageYearWhere<K extends string>(
  column: K,
  filters: MetricFilters
): Record<K, { gte?: Date; lte?: Date }> | {} {
  const range = yearRangeFilter(filters);
  return range ? ({ [column]: range } as Record<K, { gte?: Date; lte?: Date }>) : {};
}

/**
 * Joins grouped counts to their dimension's display names.
 *
 * Rows whose dimension key is null collapse into a single BLANK_LABEL row, keyed `null` -- a
 * blank is a real, selectable category, and clicking it must mean `IS NULL` rather than
 * matching on the word "(Blank)".
 *
 * The key rides along so a clicked mark can become a database predicate.
 */
export function labelGroups<K extends string | number>(
  groups: { key: K | null; count: number }[],
  names: Map<K, string>,
  lang: Lang
): BreakdownRow[] {
  const blank = blankLabel(lang);
  const rows = new Map<string, { value: number; key: K | null }>();
  for (const { key, count } of groups) {
    const label = key === null ? blank : names.get(key) ?? blank;
    const existing = rows.get(label);
    rows.set(label, { value: (existing?.value ?? 0) + count, key: existing?.key ?? key });
  }
  return [...rows.entries()]
    .map(([label, { value, key }]) => ({ label, value, key }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, lang));
}

/** Reads the selected key for one dimension, or `undefined` if it is not filtered. */
export function selected(
  filters: MetricFilters,
  dimension: DimensionId
): SelectionKey | undefined {
  const hit = filters.selections?.find((s) => s.dimension === dimension);
  return hit ? hit.key : undefined;
}
