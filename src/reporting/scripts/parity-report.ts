import "./load-env"; // must precede any import that touches the database
import db from "../../../prisma/prisma-client";
import { correctedMetrics, metricRegistry } from "../metrics/registry";
import { instituteReport } from "../spec/institute-report";
import type {
  BreakdownRow,
  Lang,
  MetricContext,
  ScalarValue,
  SeriesPoint,
} from "../metrics/types";

/**
 * Runs every metric against a live database and reports what the Power BI port changed.
 *
 * Two jobs:
 *  - Delta: for each corrected metric, run the old Power BI definition alongside the new one and
 *    print the difference, so a moved published figure is a reviewable fact.
 *  - Assertions: check the count fix and institute isolation.
 *
 * The assertions compute ground truth with independent queries -- counting the join tables
 * directly rather than through the metrics' `some` filters -- so they stay meaningful at any
 * seed size and would catch a metric that silently agrees with itself. Against real data pass
 * --no-assert if you only want the delta.
 */

const INSTITUTE_URL = process.env.PARITY_INSTITUTE ?? "alpha";
const ASSERT = !process.argv.includes("--no-assert");
/** Pass --fr to see the report in French — a quick check that name_fr is really being used. */
const LANG: Lang = process.argv.includes("--fr") ? "fr" : "en";

function render(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "(empty)";
    if ("label" in (value[0] as object))
      return (value as BreakdownRow[])
        .slice(0, 6)
        .map((r) => `${r.label}=${r.value}`)
        .join(", ") + (value.length > 6 ? ` (+${value.length - 6} more)` : "");
    if ("period" in (value[0] as object))
      return (value as SeriesPoint[]).map((r) => `${r.period}=${r.value}`).join(", ");
    return `${value.length} row(s)`;
  }
  if (value && typeof value === "object" && "value" in value)
    return String((value as { value: number }).value);
  return String(value);
}

const failures: string[] = [];
function expect(label: string, actual: unknown, expected: unknown) {
  const [a, e] = [JSON.stringify(actual), JSON.stringify(expected)];
  if (a === e) console.log(`  ok    ${label} (${e})`);
  else {
    failures.push(label);
    console.log(`  FAIL  ${label}: expected ${e}, got ${a}`);
  }
}

async function main() {
  const institute = await db.institute.findUnique({ where: { urlIdentifier: INSTITUTE_URL } });
  if (!institute) throw new Error(`Institute "${INSTITUTE_URL}" not found.`);

  const instituteId = institute.id;
  const ctx: MetricContext = { instituteId, filters: {}, lang: LANG };
  console.log(`Institute: ${institute.name} (id=${instituteId})\n`);

  console.log("=== Count delta vs the 2024 Power BI dashboard ===\n");
  for (const metric of correctedMetrics()) {
    const [now, before] = await Promise.all([metric.run(ctx), metric.powerBi!.run(ctx)]);
    const changed = JSON.stringify(now) !== JSON.stringify(before);
    console.log(`${changed ? "CHANGED" : "same   "}  ${metric.id}`);
    console.log(`          Power BI : ${render(before)}`);
    console.log(`          corrected: ${render(now)}`);
    console.log();
  }

  console.log("=== All metrics (corrected definitions) ===\n");
  for (const metric of metricRegistry.values()) {
    console.log(`  ${metric.id.padEnd(32)} ${render(await metric.run(ctx))}`);
  }

  if (!ASSERT) return;

  console.log("\n=== Assertions (ground truth computed independently) ===\n");
  const get = (id: string) => metricRegistry.get(id)!;
  // The registry is keyed by id, so a lookup returns the union of every shape. These narrow it
  // at the call site; validate-specs.ts is what proves the shape actually matches.
  const scalar = async (id: string, c: MetricContext) => (await get(id).run(c)) as ScalarValue;
  const breakdown = async (id: string, c: MetricContext) =>
    (await get(id).run(c)) as BreakdownRow[];

  // Ground truth: count the join tables directly, which is a different path from the metrics'
  // relation filters. If both were wrong in the same way, these would not agree.
  const trueMembers = await db.memberInstitute.count({ where: { instituteId } });
  const trueActiveMembers = (
    await db.memberInstitute.findMany({
      where: { instituteId },
      select: { member: { select: { is_active: true } } },
    })
  ).filter((m) => m.member.is_active).length;
  const trueProducts = await db.productInstitute.count({ where: { instituteId } });
  const trueOrgs = await db.organizationInstitute.count({ where: { instituteId } });
  const trueGrants = await db.grant.count({ where: { instituteId } });
  const trueEvents = await db.event.count({ where: { instituteId } });
  const trueSupervisions = await db.supervision.count({ where: { instituteId } });

  expect("members.total", await get("members.total").run(ctx), { value: trueMembers });
  expect("members.active", await get("members.active").run(ctx), { value: trueActiveMembers });
  expect("organizations.total", await get("organizations.total").run(ctx), { value: trueOrgs });
  expect("products.total", await get("products.total").run(ctx), { value: trueProducts });
  expect("grants.total", await get("grants.total").run(ctx), { value: trueGrants });
  expect("events.total", await get("events.total").run(ctx), { value: trueEvents });
  expect("supervisions.total", await get("supervisions.total").run(ctx), {
    value: trueSupervisions,
  });

  // Isolation: the institute's figure must be strictly less than the whole database, or the
  // tenant filter is doing nothing at all.
  const allProducts = await db.product.count();
  const allMembers = await db.member.count();
  expect("products are institute-scoped, not global", trueProducts < allProducts, true);
  expect("members are institute-scoped, not global", trueMembers < allMembers, true);

  // The count bug: author pairs must exceed distinct products (inflation), and at least one
  // product must have no registered author (the silent omission).
  const authorPairs = (
    await db.product.findMany({
      where: { institutes: { some: { instituteId } } },
      select: { _count: { select: { product_member_author: true } } },
    })
  ).reduce((s, p) => s + p._count.product_member_author, 0);
  const authorless = await db.product.count({
    where: { institutes: { some: { instituteId } }, product_member_author: { none: {} } },
  });

  expect("Power BI product count == author pairs", await get("products.total").powerBi!.run(ctx), {
    value: authorPairs,
  });
  expect("the old count was inflated (pairs > products)", authorPairs > trueProducts, true);
  expect("some products had no registered author (old count dropped them)", authorless > 0, true);

  // The year filter must actually cut, and must cut every tile -- not just the by-year chart.
  const narrow: MetricContext = {
    instituteId,
    filters: { yearFrom: 2020, yearTo: 2021 },
    lang: LANG,
  };
  const wideTotal = (await scalar("products.total", ctx)).value;
  const narrowTotal = (await scalar("products.total", narrow)).value;
  expect("year filter narrows products.total", narrowTotal < wideTotal, true);

  const wideDonut = await breakdown("products.byPeerReviewed", ctx);
  const narrowDonut = await breakdown("products.byPeerReviewed", narrow);
  const sum = (rs: BreakdownRow[]) => rs.reduce((s, r) => s + r.value, 0);
  expect("year filter narrows the donut too", sum(narrowDonut) < sum(wideDonut), true);
  // The bug that started this: the filter used to move only the by-year chart, so the donut and
  // the card disagreed with the control above them.
  expect("donut agrees with the total under the filter", sum(narrowDonut), narrowTotal);

  const narrowGrants = (await scalar("grants.total", narrow)).value;
  expect("year filter narrows grants.total", narrowGrants < trueGrants, true);

  // Cross-filtering: clicking a mark must scope every tile on the page, exactly like the year
  // control -- and the clicked category's own count must be what the total collapses to.
  const byType = await breakdown("products.byType", ctx);
  const biggestType = byType[0];
  const crossed: MetricContext = {
    instituteId,
    filters: {
      selections: [
        { dimension: "product.type", key: biggestType.key!, label: biggestType.label },
      ],
    },
    lang: LANG,
  };
  expect(
    `selecting type "${biggestType.label}" collapses products.total to its own count`,
    (await scalar("products.total", crossed)).value,
    biggestType.value
  );
  expect(
    "a cross-filtered donut sums to the same total",
    sum(await breakdown("products.byPeerReviewed", crossed)),
    biggestType.value
  );

  // A blank selection must mean IS NULL, not a match on the word "(Blank)".
  const withBlank = await breakdown("members.byFaculty", ctx);
  if (withBlank.some((r) => r.key === null)) {
    const blankRow = withBlank.find((r) => r.key === null)!;
    const blankCtx: MetricContext = {
      instituteId,
      filters: { selections: [{ dimension: "member.faculty", key: null, label: blankRow.label }] },
      lang: LANG,
    };
    expect(
      "selecting the blank slice filters on IS NULL",
      (await scalar("members.total", blankCtx)).value,
      blankRow.value
    );
  }

  // Two selections must AND together, not replace one another.
  const byTopic = await breakdown("products.byTopic", crossed);
  if (byTopic.length) {
    const both: MetricContext = {
      instituteId,
      filters: {
        selections: [
          { dimension: "product.type", key: biggestType.key!, label: biggestType.label },
          { dimension: "product.topic", key: byTopic[0].key!, label: byTopic[0].label },
        ],
      },
      lang: LANG,
    };
    const bothTotal = (await scalar("products.total", both)).value;
    expect("two selections AND together", bothTotal <= biggestType.value, true);
    expect("the ANDed result matches the topic slice within the type", bothTotal, byTopic[0].value);
  }

  // Table column keys must exist in what the metric actually returns. A typo here would render
  // a silently empty column rather than failing -- the sort of thing nobody notices.
  console.log("\n  table columns:");
  for (const page of instituteReport.pages) {
    for (const { tile } of page.tiles) {
      if (tile.type !== "table" || !tile.columns) continue;
      const rows = (await get(tile.metric).run(ctx)) as Record<string, unknown>[];
      if (!rows.length) {
        console.log(`  skip  ${tile.metric}: no rows to check against`);
        continue;
      }
      const present = new Set(Object.keys(rows[0]));
      const missing = tile.columns.map((c) => c.key).filter((k) => !present.has(k));
      expect(`${tile.metric} column keys all exist`, missing, []);
    }
  }

  console.log(failures.length ? `\n${failures.length} FAILED` : "\nAll assertions passed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    process.exit(failures.length ? 1 : 0);
  });
