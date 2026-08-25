import { Alert, Button, Col, InputNumber, Row, Space, Tabs, Tag } from "antd";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import CenteredSpinner from "../../components/loading/centered-spinner";
import { LanguageCtx } from "../../services/context/language-ctx";
import useReportPage, { type YearRange } from "../../services/use-report-page";
import type {
  BreakdownRow,
  Selection,
  SelectionKey,
  SeriesPoint,
  TableRow,
} from "../metrics/types";
import type { PageSpec, ReportSpec, TileSpec } from "../spec/types";
import { INK } from "./palette";
import {
  BarTile,
  CardTile,
  ColumnTile,
  DonutTile,
  ListTile,
  MapTile,
  TableTile,
  TileCard,
  type OnSelect,
} from "./tiles";

/**
 * Renders a report page from its spec.
 *
 * The engine is generic over both reports: it reads the spec and draws whatever the API returned.
 * Adding or changing a report is a spec edit -- no component here changes.
 *
 * This module runs in the BROWSER, so it must never import from reporting/metrics at value
 * level. Those modules import prisma-client, and pulling one in bundles PrismaClient into the
 * client ("PrismaClient is unable to be run in the browser"). Tile titles and dimensions
 * therefore arrive in the API response rather than being looked up here. Type-only imports are
 * fine -- they are erased at compile time. The spec files are pure data and safe to import.
 */

function PageBody({
  spec,
  page,
  urlIdentifier,
}: {
  spec: ReportSpec;
  page: PageSpec;
  urlIdentifier?: string;
}) {
  const { en } = useContext(LanguageCtx);
  const [years, setYears] = useState<YearRange>({});
  const [selections, setSelections] = useState<Selection[]>([]);
  const { data, meta, loading, error } = useReportPage({
    audience: spec.audience,
    urlIdentifier,
    pageId: page.id,
    years,
    selections,
    lang: en ? "en" : "fr",
  });

  /**
   * Toggles a cross-filter. Clicking the selected mark again clears it, which is the only
   * discoverable way back out of a filter you set by clicking -- so the chips below are a
   * convenience, not the sole exit.
   */
  const toggle = (dimension: string, key: SelectionKey, label: string) =>
    setSelections((current) => {
      const existing = current.find((s) => s.dimension === dimension);
      if (existing && existing.key === key)
        return current.filter((s) => s.dimension !== dimension);
      return [
        ...current.filter((s) => s.dimension !== dimension),
        { dimension, key, label } as Selection,
      ];
    });

  const selectedKeyFor = (dimension?: string) =>
    dimension ? selections.find((s) => s.dimension === dimension)?.key : undefined;

  // A single year (from clicking a column) is shown as a chip too, so every active filter is
  // visible in one row rather than split between a chart and the inputs.
  const singleYear =
    years.yearFrom !== undefined && years.yearFrom === years.yearTo ? years.yearFrom : undefined;

  const anyFilter = selections.length > 0 || years.yearFrom !== undefined || years.yearTo !== undefined;

  function renderTile(tile: TileSpec, value: unknown) {
    if (value === undefined) return null;
    const dimension = meta?.[tile.metric]?.dimension;
    const onSelect: OnSelect = dimension
      ? (key, label) => toggle(dimension, key, label)
      : undefined;
    const selectedKey = selectedKeyFor(dimension);

    switch (tile.type) {
      case "card":
        return <CardTile value={(value as { value: number }).value} format={tile.format} />;
      case "donut":
        return (
          <DonutTile rows={value as BreakdownRow[]} onSelect={onSelect} selectedKey={selectedKey} />
        );
      case "bar":
        return (
          <BarTile rows={value as BreakdownRow[]} onSelect={onSelect} selectedKey={selectedKey} />
        );
      case "map":
        return (
          <MapTile rows={value as BreakdownRow[]} onSelect={onSelect} selectedKey={selectedKey} />
        );
      case "column":
        return (
          <ColumnTile
            points={value as SeriesPoint[]}
            selectedYear={singleYear}
            onSelectYear={
              page.yearFilter
                ? (year) =>
                    setYears((y) =>
                      // Clicking the already-selected year clears it, matching mark toggling.
                      y.yearFrom === year && y.yearTo === year ? {} : { yearFrom: year, yearTo: year }
                    )
                : undefined
            }
          />
        );
      case "list":
        return <ListTile rows={value as BreakdownRow[]} />;
      case "table":
        return (
          <TableTile
            rows={value as TableRow[]}
            columns={tile.columns?.map((c) => ({
              key: c.key,
              label: en ? c.label.en : c.label.fr,
              format: c.format,
            }))}
          />
        );
    }
  }

  if (error)
    return (
      <Alert
        type="error"
        showIcon
        message={en ? "Could not load report" : "Chargement impossible"}
        description={error}
      />
    );
  if (loading && !data) return <CenteredSpinner />;

  return (
    <>
      {/* One filter row above everything it scopes -- never a filter inside a tile. */}
      <Space style={{ marginBottom: 16 }} wrap size={[8, 8]}>
        {page.yearFilter && (
          <>
            {/* The label names the date column being cut: it differs per page (publish year
                here, obtained year there) and every tile below moves with it. */}
            <span style={{ color: INK.secondary }}>
              {en ? page.yearFilter.label.en : page.yearFilter.label.fr}
            </span>
            <InputNumber
              placeholder={en ? "From" : "De"}
              value={years.yearFrom}
              onChange={(v) => setYears((y) => ({ ...y, yearFrom: v ?? undefined }))}
              min={1900}
              max={2200}
            />
            <InputNumber
              placeholder={en ? "To" : "À"}
              value={years.yearTo}
              onChange={(v) => setYears((y) => ({ ...y, yearTo: v ?? undefined }))}
              min={1900}
              max={2200}
            />
          </>
        )}

        {selections.map((s) => (
          <Tag
            key={s.dimension}
            closable
            onClose={() => setSelections((c) => c.filter((x) => x.dimension !== s.dimension))}
            color="blue"
          >
            {s.label}
          </Tag>
        ))}

        {anyFilter && (
          <Button
            size="small"
            type="link"
            onClick={() => {
              setSelections([]);
              setYears({});
            }}
          >
            {en ? "Clear all filters" : "Effacer tous les filtres"}
          </Button>
        )}
      </Space>

      {/* Hold the previous render at reduced opacity on refetch -- no skeleton flash, no jump. */}
      <Row gutter={[16, 16]} style={{ opacity: loading ? 0.6 : 1, transition: "opacity 150ms" }}>
        {page.tiles.map(({ span, tile }, i) => {
          const t = meta?.[tile.metric]?.title;
          const title = t ? (en ? t.en : t.fr) : tile.metric;
          return (
            <Col key={`${tile.metric}-${i}`} xs={24} md={span}>
              <TileCard title={title}>{renderTile(tile, data?.[tile.metric])}</TileCard>
            </Col>
          );
        })}
      </Row>
    </>
  );
}

export default function ReportView({ spec }: { spec: ReportSpec }) {
  const router = useRouter();
  const { en } = useContext(LanguageCtx);
  const urlIdentifier = router.query.instituteId as string | undefined;
  const activePage = (router.query.pageId as string) ?? spec.pages[0]?.id;

  if (spec.audience === "institute" && !urlIdentifier) return <CenteredSpinner />;

  const basePath = spec.audience === "super" ? "/admin-reports" : `/${urlIdentifier}/reports`;

  return (
    <>
      <h1>{en ? spec.title.en : spec.title.fr}</h1>
      <Tabs
        activeKey={activePage}
        onChange={(pageId) => router.push(`${basePath}/${pageId}`, undefined, { shallow: true })}
        items={spec.pages.map((page) => ({
          key: page.id,
          label: en ? page.title.en : page.title.fr,
          // Filters are per-page and reset on tab change: carrying a product-type selection onto
          // the Grants page would be meaningless, and silently carrying it would be worse.
          children: <PageBody spec={spec} page={page} urlIdentifier={urlIdentifier} />,
        }))}
        // antd 5: `destroyInactiveTabPane` -> `destroyOnHidden`. Unmount the hidden tab so its
        // per-page filter state resets when you leave it.
        destroyOnHidden
      />
    </>
  );
}
