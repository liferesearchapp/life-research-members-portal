import { eventMetrics } from "./events";
import { grantMetrics } from "./grants";
import { memberMetrics } from "./members";
import { organizationMetrics } from "./organizations";
import { productMetrics } from "./products";
import { supervisionMetrics } from "./supervisions";
import type { Metric } from "./types";

/**
 * The metric registry: the single place that knows how a reported number is computed.
 *
 * Report specs reference metrics by id and never contain query logic, so re-pointing at a
 * changed schema means editing this layer only. Adding a report is a spec edit, not code.
 */

const ALL: Metric[] = [
  ...memberMetrics,
  ...organizationMetrics,
  ...productMetrics,
  ...grantMetrics,
  ...supervisionMetrics,
  ...eventMetrics,
];

const byId = new Map<string, Metric>();
for (const metric of ALL) {
  if (byId.has(metric.id)) throw new Error(`Duplicate metric id: ${metric.id}`);
  byId.set(metric.id, metric);
}

export const metricRegistry: ReadonlyMap<string, Metric> = byId;

export function getMetric(id: string): Metric | undefined {
  return byId.get(id);
}

/** Metrics whose definition was corrected during the Power BI port. */
export function correctedMetrics(): Metric[] {
  return ALL.filter((m) => m.powerBi);
}
