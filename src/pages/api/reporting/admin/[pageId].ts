import type { NextApiRequest, NextApiResponse } from "next";
import { requireSuperReportingScope } from "../../../../reporting/auth/scope";
import { getSuperMetric } from "../../../../reporting/metrics/admin";
import type { MetricFilters } from "../../../../reporting/metrics/types";
import { adminReport } from "../../../../reporting/spec/admin-report";
import { parseLang, parseSelections, type ReportPageRes } from "../[instituteId]/[pageId]";

/**
 * Serves one page of the RIMS administrator report.
 *
 * A separate endpoint from the institute report on purpose. It resolves metrics from the super
 * registry only, which has no instituteId and returns nothing but counts and aggregates -- so
 * there is no code path here that could reach a member's record, even by mistake.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReportPageRes | string>
) {
  const { pageId } = req.query;
  if (typeof pageId !== "string") return res.status(400).send("Page is required.");

  const scope = await requireSuperReportingScope(req, res);
  if (!scope) return;

  const page = adminReport.pages.find((p) => p.id === pageId);
  if (!page) return res.status(404).send("Report page not found.");

  try {
    const metricIds = [...new Set(page.tiles.map((t) => t.tile.metric))];
    const meta: ReportPageRes["meta"] = {};

    // Only the dimensions this page's own tiles expose may be selected.
    const allowedDimensions = new Set<string>();
    for (const id of metricIds) {
      const metric = getSuperMetric(id);
      if (!metric) throw new Error(`Admin spec references unknown super metric "${id}"`);
      meta[id] = { title: metric.title, dimension: metric.dimension };
      if (metric.dimension) allowedDimensions.add(metric.dimension);
    }

    const lang = parseLang(req.query.lang);
    const filters: MetricFilters = {
      selections: parseSelections(req.query.select, allowedDimensions),
    };

    const results = await Promise.all(
      metricIds.map(async (id) => [id, await getSuperMetric(id)!.run({ filters, lang })] as const)
    );

    return res.status(200).json({ pageId: page.id, data: Object.fromEntries(results), meta });
  } catch (e: any) {
    console.error(`Admin report page "${pageId}" failed:`, e.message);
    return res.status(500).send("Could not build this report.");
  }
}
