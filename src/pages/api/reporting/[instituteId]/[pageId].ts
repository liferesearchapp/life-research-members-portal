import type { NextApiRequest, NextApiResponse } from "next";
import { requireInstituteReportingScope } from "../../../../reporting/auth/scope";
import { getMetric } from "../../../../reporting/metrics/registry";
import type {
  Bilingual,
  DimensionId,
  Lang,
  MetricFilters,
  Selection,
} from "../../../../reporting/metrics/types";
import { instituteReport } from "../../../../reporting/spec/institute-report";

/**
 * Serves one page of the institute report.
 *
 * This is the security boundary for reporting: PageAuthGuard on the client gates the UI only.
 * Authorization happens here, against the caller's session, before any metric runs.
 *
 * The response carries only the aggregates the page's tiles need. Metrics are keyed by id and
 * deduplicated, so a page that shows the same metric twice queries once.
 */

export type ReportPageRes = {
  pageId: string;
  data: Record<string, unknown>;
  /**
   * Per-metric display info, keyed by metric id: the tile's title, and the dimension it groups
   * by (present only when the tile is clickable for cross-filtering).
   *
   * Sent from the server rather than looked up in the browser on purpose: the metric registry
   * imports every metric module, and those import prisma-client, so importing it from a client
   * component drags PrismaClient into the browser bundle ("PrismaClient is unable to be run in
   * the browser"). The client must never import from reporting/metrics at anything but type
   * level.
   */
  meta: Record<string, { title: Bilingual; dimension?: DimensionId }>;
};

function parseYear(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1900 && n <= 2200 ? n : undefined;
}

/** The reader's language. Labels are built server-side, so it has to travel with the request. */
export function parseLang(value: unknown): Lang {
  return value === "fr" ? "fr" : "en";
}

/**
 * Parses the `select` query parameter into cross-filter selections.
 *
 * Shape: a JSON array of {dimension, key, label}. Anything malformed is dropped rather than
 * throwing -- a mangled URL should render an unfiltered page, not a 500. Only dimensions the
 * page's own metrics declare are honoured, so a hand-edited URL cannot filter by something the
 * report does not offer.
 */
export function parseSelections(value: unknown, allowed: Set<string>): Selection[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const raw = JSON.parse(value);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (s): s is Selection =>
          s &&
          typeof s.dimension === "string" &&
          allowed.has(s.dimension) &&
          (typeof s.key === "string" || typeof s.key === "number" || typeof s.key === "boolean" || s.key === null)
      )
      .map((s) => ({ dimension: s.dimension, key: s.key, label: String(s.label ?? "") }));
  } catch {
    return [];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReportPageRes | string>
) {
  const { instituteId, pageId } = req.query;
  if (typeof instituteId !== "string" || typeof pageId !== "string")
    return res.status(400).send("Institute and page are required.");

  // Authorize before touching any data.
  const scope = await requireInstituteReportingScope(req, res, instituteId);
  if (!scope) return;
  if (scope.kind !== "institute") return res.status(403).send("Institute scope required.");

  const page = instituteReport.pages.find((p) => p.id === pageId);
  if (!page) return res.status(404).send("Report page not found.");

  try {
    const metricIds = [...new Set(page.tiles.map((t) => t.tile.metric))];
    const meta: ReportPageRes["meta"] = {};

    // Only the dimensions this page's own tiles expose may be selected.
    const allowedDimensions = new Set<string>();
    for (const id of metricIds) {
      const metric = getMetric(id);
      // Specs are validated in CI, so this should be unreachable; fail loudly rather than
      // rendering an empty tile that reads as "no data".
      if (!metric) throw new Error(`Spec references unknown metric "${id}"`);
      meta[id] = { title: metric.title, dimension: metric.dimension };
      if (metric.dimension) allowedDimensions.add(metric.dimension);
    }

    const lang = parseLang(req.query.lang);
    const filters: MetricFilters = {
      ...(page.yearFilter
        ? { yearFrom: parseYear(req.query.yearFrom), yearTo: parseYear(req.query.yearTo) }
        : {}),
      selections: parseSelections(req.query.select, allowedDimensions),
    };

    const results = await Promise.all(
      metricIds.map(
        async (id) =>
          [id, await getMetric(id)!.run({ instituteId: scope.instituteId, filters, lang })] as const
      )
    );

    return res.status(200).json({ pageId: page.id, data: Object.fromEntries(results), meta });
  } catch (e: any) {
    console.error(`Reporting page "${pageId}" failed:`, e.message);
    return res.status(500).send("Could not build this report.");
  }
}
