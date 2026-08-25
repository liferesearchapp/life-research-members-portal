import { Card, Empty, Statistic, Table } from "antd";
import { useContext } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LanguageCtx } from "../../services/context/language-ctx";
import type { BreakdownRow, SelectionKey, SeriesPoint, TableRow } from "../metrics/types";
import { foldTail, sliceFill } from "./fold";
import { INK, MAX_DONUT_SEGMENTS, SINGLE_HUE } from "./palette";

/**
 * Tile components: one per TileSpec type.
 *
 * Each takes a metric result and draws it. Tiles never fetch and never know which report they
 * are in -- the page passes the data in.
 */

const AXIS = { fill: INK.muted, fontSize: 12 };
const CHART_HEIGHT = 260;

/**
 * Charts draw at their final value immediately, with no mount animation.
 *
 * Recharts restarts its grow-from-zero animation on every container resize, so a window resize
 * (or a print/export, which resizes) makes marks briefly vanish and re-grow. On a report that
 * reads as flicker, and it makes the rendered output non-deterministic to verify. A director
 * reading grant totals gains nothing from watching bars grow; it also spares anyone who has
 * asked their OS for reduced motion.
 */
const ANIMATE = false;

/**
 * A click on a mark, if the tile's metric declares a dimension. Undefined means not clickable.
 * Passing the row's key (not its label) is what lets the server turn this into a predicate.
 */
export type OnSelect = ((key: SelectionKey, label: string) => void) | undefined;

/** Marks not matching the active selection recede rather than disappear, keeping the context. */
const DIMMED = 0.25;
const markOpacity = (isSelected: boolean | undefined) =>
  isSelected === undefined ? 1 : isSelected ? 1 : DIMMED;

function useLang() {
  const { en } = useContext(LanguageCtx);
  return en;
}

function NoData() {
  const en = useLang();
  return <Empty description={en ? "No data" : "Aucune donnée"} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
}

/** Power BI: card. A single figure -- the number is the chart, so no one-bar bar chart. */
export function CardTile({ value, format }: { value: number; format?: "number" | "currency" }) {
  const en = useLang();
  const formatted =
    format === "currency"
      ? new Intl.NumberFormat(en ? "en-CA" : "fr-CA", {
          style: "currency",
          currency: "CAD",
          maximumFractionDigits: 0,
        }).format(value)
      : new Intl.NumberFormat(en ? "en-CA" : "fr-CA").format(value);

  // Proportional figures on purpose: tabular-nums makes a large standalone number read loose.
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
      <Statistic value={formatted} valueStyle={{ color: INK.primary, fontSize: 32 }} />
    </div>
  );
}

/** Power BI: donutChart. Part-to-whole at a glance only. */
export function DonutTile({
  rows,
  onSelect,
  selectedKey,
}: {
  rows: BreakdownRow[];
  onSelect?: OnSelect;
  selectedKey?: SelectionKey;
}) {
  const en = useLang();
  if (!rows.length) return <NoData />;

  const otherLabel = en ? "Other" : "Autre";
  const data = foldTail(rows, MAX_DONUT_SEGMENTS, otherLabel);
  const total = data.reduce((s, r) => s + r.value, 0);
  const hasSelection = selectedKey !== undefined;

  // "Other" is a fold, not a category, so it has no key and cannot be selected.
  const selectable = (row: BreakdownRow) => Boolean(onSelect) && row.label !== otherLabel;

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={1} // 2px surface gap between fills, not a border around them
          stroke={INK.surface}
          strokeWidth={2}
          // Direct labels are required relief: three palette hues fall below 3:1 on this surface,
          // so identity and value must never depend on colour alone.
          //
          // Drawn explicitly in ink rather than left to Recharts, which colours labels with the
          // series fill by default. Text must never wear the series colour: it would make the
          // label's legibility depend on a hue chosen for a fill -- and three of these hues are
          // exactly the ones that fail contrast. The coloured arc beside it carries identity.
          label={(props: any) => (
            <text
              x={props.x}
              y={props.y}
              fill={INK.secondary}
              fontSize={12}
              textAnchor={props.textAnchor}
              dominantBaseline="central"
            >
              {`${props.name}: ${props.value}`}
            </text>
          )}
          labelLine={{ stroke: INK.baseline }}
          isAnimationActive={ANIMATE}
          onClick={(_: any, index: number) => {
            const row = data[index];
            if (selectable(row)) onSelect!(row.key ?? null, row.label);
          }}
        >
          {data.map((row, i) => (
            <Cell
              key={row.label}
              fill={sliceFill(i, row.label, otherLabel)}
              opacity={markOpacity(hasSelection ? row.key === selectedKey : undefined)}
              cursor={selectable(row) ? "pointer" : "default"}
            />
          ))}
        </Pie>
        <Legend
          formatter={(v) => <span style={{ color: INK.secondary, fontSize: 12 }}>{v}</span>}
        />
        <Tooltip
          formatter={(v: any) => [`${v} (${Math.round((Number(v) / total) * 100)}%)`, ""]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Power BI: clusteredBarChart. Ranked magnitude over nominal categories.
 * One series -> one hue for every bar: a value-ramp here would double-encode bar length as
 * colour and burn the only free channel on information the length already shows.
 */
export function BarTile({
  rows,
  onSelect,
  selectedKey,
}: {
  rows: BreakdownRow[];
  onSelect?: OnSelect;
  selectedKey?: SelectionKey;
}) {
  if (!rows.length) return <NoData />;
  const hasSelection = selectedKey !== undefined;

  return (
    <ResponsiveContainer width="100%" height={Math.max(CHART_HEIGHT, rows.length * 32 + 40)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} stroke={INK.gridline} />
        <XAxis type="number" tick={AXIS} axisLine={{ stroke: INK.baseline }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={AXIS}
          width={140}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: "rgba(11,11,11,0.04)" }} />
        <Bar
          dataKey="value"
          fill={SINGLE_HUE}
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          isAnimationActive={ANIMATE}
          cursor={onSelect ? "pointer" : "default"}
          onClick={(entry: any) => onSelect?.(entry?.key ?? null, entry?.label ?? "")}
        >
          {rows.map((row) => (
            <Cell
              key={row.label}
              opacity={markOpacity(hasSelection ? row.key === selectedKey : undefined)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Power BI: waterfallChart. Ported as plain columns -- these are per-year counts, and
 * waterfall's running-total connectors implied an accumulation that was never in the data.
 */
export function ColumnTile({
  points,
  onSelectYear,
  selectedYear,
}: {
  points: SeriesPoint[];
  /** Clicking a column narrows the page to that single year. */
  onSelectYear?: (year: number) => void;
  selectedYear?: number;
}) {
  if (!points.length) return <NoData />;

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={points} margin={{ left: 0, right: 8 }}>
        <CartesianGrid vertical={false} stroke={INK.gridline} />
        <XAxis dataKey="period" tick={AXIS} axisLine={{ stroke: INK.baseline }} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: "rgba(11,11,11,0.04)" }} />
        <Bar
          dataKey="value"
          fill={SINGLE_HUE}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={ANIMATE}
          cursor={onSelectYear ? "pointer" : "default"}
          // A year click feeds the page's existing year range rather than a separate mechanism,
          // so the control above updates to match and stays the single place to clear it.
          onClick={(entry: any) => {
            const year = Number(entry?.period);
            if (onSelectYear && Number.isInteger(year)) onSelectYear(year);
          }}
        >
          {points.map((p) => (
            <Cell
              key={p.period}
              opacity={markOpacity(
                selectedYear === undefined ? undefined : Number(p.period) === selectedYear
              )}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Power BI: multiRowCard. A compact label/value list -- a table of two columns, no chart. */
export function ListTile({ rows }: { rows: BreakdownRow[] }) {
  if (!rows.length) return <NoData />;
  return (
    <div>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            padding: "6px 0",
            borderBottom: `1px solid ${INK.gridline}`,
            color: INK.secondary,
          }}
        >
          <span>{row.label}</span>
          <span style={{ color: INK.primary, fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Power BI: tableEx / pivotTable. Also the table-view twin for the charts on the same page. */
export function TableTile({
  rows,
  columns,
}: {
  rows: TableRow[];
  columns?: { key: string; label: string; format?: "currency" }[];
}) {
  const en = useLang();
  if (!rows.length) return <NoData />;

  const locale = en ? "en-CA" : "fr-CA";
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });

  const keys = columns?.map((c) => c.key) ?? Object.keys(rows[0]);
  const antColumns = keys.map((key) => {
    const spec = columns?.find((c) => c.key === key);
    // A column is numeric if its data is. Numbers get right-aligned tabular figures so digits
    // line up down the column -- the one place tabular-nums belongs.
    const numeric = rows.some((r) => typeof r[key] === "number");

    return {
      title: spec?.label ?? key,
      dataIndex: key,
      key,
      ellipsis: true,
      align: (numeric ? "right" : "left") as "right" | "left",
      render: (value: unknown) => {
        if (value === null || value === undefined) return "";
        if (spec?.format === "currency" && typeof value === "number") return money.format(value);
        if (typeof value === "number")
          return <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>;
        return String(value);
      },
      sorter: (a: TableRow, b: TableRow) => {
        const [x, y] = [a[key], b[key]];
        if (typeof x === "number" && typeof y === "number") return x - y;
        return String(x ?? "").localeCompare(String(y ?? ""), locale);
      },
    };
  });

  return (
    <Table
      size="small"
      dataSource={rows.map((r, i) => ({ ...r, key: i }))}
      columns={antColumns}
      pagination={rows.length > 10 ? { pageSize: 10, size: "small" } : false}
      scroll={{ x: true }}
    />
  );
}

/**
 * Power BI: map (a city/country bubble map).
 *
 * Rendered as a ranked list rather than a map: the portal has no mapping dependency, and a
 * geographic projection is a poor way to compare counts anyway. The locations and their counts
 * are all here; a real map is a contained follow-up if the geography itself carries meaning.
 */
export function MapTile({
  rows,
  onSelect,
  selectedKey,
}: {
  rows: BreakdownRow[];
  onSelect?: OnSelect;
  selectedKey?: SelectionKey;
}) {
  return <BarTile rows={rows} onSelect={onSelect} selectedKey={selectedKey} />;
}

export function TileCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card
      size="small"
      title={title}
      // antd 5: `bordered` -> `variant`, and `bodyStyle` -> `styles.body`.
      variant="outlined"
      // Tiles in a row stretch to the tallest (usually a 260px chart), so the body must be able
      // to fill. Vertical centring is left to CardTile: a stat number should sit in the middle
      // of a tall tile, but a list or table must stay top-aligned.
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
      styles={{ body: { flex: 1, display: "flex", flexDirection: "column" } }}
    >
      {children}
    </Card>
  );
}
