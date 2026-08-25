import type { Bilingual } from "../metrics/types";

/**
 * Report specs are data, not code.
 *
 * A tile names a metric and a way to draw it; it never contains query logic. Changing a report
 * means editing a spec, and re-pointing at a changed schema means editing the metric registry.
 * Nothing else in the engine knows about either.
 */

export type TileSpec =
  /** Single figure. Power BI: card. */
  | { type: "card"; metric: string; format?: "number" | "currency" }
  /** Part-to-whole breakdown. Power BI: donutChart. */
  | { type: "donut"; metric: string }
  /** Ranked breakdown. Power BI: clusteredBarChart. */
  | { type: "bar"; metric: string; orientation?: "horizontal" | "vertical" }
  /** Per-period counts. Power BI: waterfallChart (rendered as columns; see note in the engine). */
  | { type: "column"; metric: string }
  /** Compact label/value list. Power BI: multiRowCard. */
  | { type: "list"; metric: string }
  /**
   * Detail rows. Power BI: tableEx / pivotTable.
   *
   * `columns` also decides which keys are shown, so internal join ids can be left out. Without
   * it the table falls back to the metric's raw object keys as headers -- untranslated and ugly.
   */
  | {
      type: "table";
      metric: string;
      columns?: { key: string; label: Bilingual; format?: "currency" }[];
    }
  /** Geographic distribution. Power BI: map. */
  | { type: "map"; metric: string };

export type PageSpec = {
  id: string;
  title: Bilingual;
  /**
   * Shows a year-range control that scopes EVERY tile on the page (Power BI: the page slicer).
   *
   * Each page filters on one natural date column -- publish date for products, obtained date for
   * grants, and so on -- so the label must name it. "Years" would be a lie on a page where the
   * filter means obtained year; the reader has to know which date is being cut.
   */
  yearFilter?: { label: Bilingual };
  tiles: { span: number; tile: TileSpec }[]; // span is antd's 24-column grid
};

export type ReportSpec = {
  id: string;
  title: Bilingual;
  audience: "institute" | "super";
  pages: PageSpec[];
};
