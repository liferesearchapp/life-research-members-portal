import { useCallback, useEffect, useState } from "react";
import type { ReportPageRes } from "../pages/api/reporting/[instituteId]/[pageId]";
import type { Lang, Selection } from "../reporting/metrics/types";
import ApiRoutes from "../routing/api-routes";
import getAuthHeader from "./headers/auth-header";

export type YearRange = { yearFrom?: number; yearTo?: number };

type Args = {
  audience: "institute" | "super";
  /** Required for the institute report; ignored for the admin report. */
  urlIdentifier?: string;
  pageId?: string;
  years: YearRange;
  /** Cross-filters from clicked marks. */
  selections: Selection[];
  /** Row labels are built server-side from name_en/name_fr, so the language goes with the request. */
  lang: Lang;
};

/**
 * Fetches one page of a report.
 *
 * Reporting endpoints are authorized, so this must send the auth header -- unlike the portal's
 * public endpoints, an unauthenticated call gets a 401 rather than data.
 */
export default function useReportPage({
  audience,
  urlIdentifier,
  pageId,
  years,
  selections,
  lang,
}: Args) {
  const [data, setData] = useState<ReportPageRes["data"] | null>(null);
  // Tile titles and dimensions come from the server: the metric registry cannot be imported in
  // the browser without dragging PrismaClient into the bundle.
  const [meta, setMeta] = useState<ReportPageRes["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { yearFrom, yearTo } = years;
  // Serialised so the effect re-runs on content change rather than array identity.
  const selectKey = selections.length ? JSON.stringify(selections) : "";

  const fetchPage = useCallback(async () => {
    if (!pageId) return;
    if (audience === "institute" && !urlIdentifier) return;

    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeader();
      if (!headers) {
        setError("Not signed in.");
        return;
      }

      const query = new URLSearchParams();
      if (yearFrom !== undefined) query.set("yearFrom", String(yearFrom));
      if (yearTo !== undefined) query.set("yearTo", String(yearTo));
      if (selectKey) query.set("select", selectKey);
      query.set("lang", lang);
      const q = query.toString();

      const url =
        audience === "super"
          ? ApiRoutes.adminReportPage(pageId, q)
          : ApiRoutes.reportPage(urlIdentifier!, pageId, q);

      const res = await fetch(url, { headers });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const body: ReportPageRes = await res.json();
      setData(body.data);
      setMeta(body.meta);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // lang is a dependency: toggling FR must refetch, since the labels come from the server.
  }, [audience, urlIdentifier, pageId, yearFrom, yearTo, selectKey, lang]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return { data, meta, loading, error, refetch: fetchPage };
}
