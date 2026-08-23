import { getSuperMetric } from "../metrics/admin";
import { getMetric } from "../metrics/registry";
import type { MetricShape } from "../metrics/types";
import type { ReportSpec, TileSpec } from "./types";

/**
 * Validates a report spec against the metric registry.
 *
 * Specs are data, so a typo in a metric id would otherwise surface as an empty tile in front of
 * an institute director. This turns that into a build/test failure.
 */

/** The metric shape each tile type can draw. */
const TILE_SHAPE: Record<TileSpec["type"], MetricShape> = {
  card: "scalar",
  donut: "breakdown",
  bar: "breakdown",
  column: "series",
  list: "breakdown",
  table: "rows",
  map: "breakdown",
};

export function validateReportSpec(spec: ReportSpec): string[] {
  const errors: string[] = [];
  const seenPages = new Set<string>();

  // An institute spec must resolve against the institute registry and a super spec against the
  // super registry -- crossing them would mean an institute report serving cross-institute data,
  // or the admin report reaching for institute-scoped metrics it has no instituteId for.
  const lookup = spec.audience === "super" ? getSuperMetric : getMetric;

  for (const page of spec.pages) {
    if (seenPages.has(page.id)) errors.push(`${spec.id}: duplicate page id "${page.id}"`);
    seenPages.add(page.id);

    page.tiles.forEach(({ tile, span }, i) => {
      const where = `${spec.id}/${page.id}[${i}] (${tile.type} -> ${tile.metric})`;
      const metric = lookup(tile.metric);

      if (!metric) {
        errors.push(`${where}: no such metric in the ${spec.audience} registry`);
        return;
      }
      const expected = TILE_SHAPE[tile.type];
      if (metric.shape !== expected) {
        errors.push(
          `${where}: a ${tile.type} tile needs a "${expected}" metric, but this metric is "${metric.shape}"`
        );
      }
      if (span < 1 || span > 24) errors.push(`${where}: span ${span} is outside the 1-24 grid`);
    });

    const rowTotal = page.tiles.reduce((sum, t) => sum + t.span, 0);
    if (rowTotal % 24 !== 0) {
      errors.push(
        `${spec.id}/${page.id}: tile spans total ${rowTotal}, which does not fill whole 24-column rows`
      );
    }
  }

  return errors;
}
