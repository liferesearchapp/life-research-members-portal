import "./load-env"; // must precede any import that touches the database
import db from "../../../prisma/prisma-client";
import { superMetricRegistry } from "../metrics/admin";
import type { BreakdownRow, Lang } from "../metrics/types";

/** Runs every cross-institute metric against a live database. Pass --fr for French labels. */
const LANG: Lang = process.argv.includes("--fr") ? "fr" : "en";

function render(value: unknown): string {
  if (Array.isArray(value)) {
    if (!value.length) return "(empty)";
    if ("label" in (value[0] as object))
      return (value as BreakdownRow[]).map((r) => `${r.label}=${r.value}`).join(", ");
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
  const get = (id: string) => superMetricRegistry.get(id)!;
  const unfiltered = { filters: {}, lang: LANG };

  for (const metric of superMetricRegistry.values()) {
    console.log(`  ${metric.id.padEnd(32)} ${render(await metric.run(unfiltered))}`);
  }

  // The overview table is the one place institute names and counts meet; print it in full so a
  // reviewer can confirm it carries no personal data.
  const overview = await get("admin.institutesOverview").run(unfiltered);
  console.log("\n  institutesOverview rows:");
  for (const row of overview as any[]) console.log("   ", JSON.stringify(row));

  console.log("\n=== Cross-filter assertions ===\n");

  // Selecting an institute must scope the whole page to it.
  const byInstitute = (await get("admin.institutesByMembers").run(unfiltered)) as BreakdownRow[];
  const biggest = byInstitute[0];
  const oneInstitute = {
    filters: {
      selections: [
        { dimension: "admin.institute" as const, key: biggest.key!, label: biggest.label },
      ],
    },
    lang: LANG,
  };

  expect("selecting an institute scopes institutesTotal to 1", await get("admin.institutesTotal").run(oneInstitute), { value: 1 });
  expect(
    "its member bar collapses to that institute only",
    ((await get("admin.institutesByMembers").run(oneInstitute)) as BreakdownRow[]).length,
    1
  );
  expect(
    "the overview collapses to one row",
    ((await get("admin.institutesOverview").run(oneInstitute)) as unknown[]).length,
    1
  );
  expect(
    "accounts scope to that institute's members",
    ((await get("admin.accountsTotal").run(oneInstitute)) as any).value < ((await get("admin.accountsTotal").run(unfiltered)) as any).value,
    true
  );

  // Selecting a login bucket must scope the adoption cards to it.
  const recency = (await get("admin.accountsByLoginRecency").run(unfiltered)) as BreakdownRow[];
  const never = recency.find((r) => r.key === "never")!;
  const neverCtx = {
    filters: {
      selections: [
        { dimension: "admin.loginRecency" as const, key: "never", label: never.label },
      ],
    },
    lang: LANG,
  };
  expect(
    "selecting the Never bucket collapses accountsTotal to its count",
    await get("admin.accountsTotal").run(neverCtx),
    { value: never.value }
  );

  // A dated bucket must round-trip through its date-range predicate back to the same count.
  const dated = recency.find((r) => r.key === "last30" && r.value > 0);
  if (dated) {
    const datedCtx = {
      filters: {
        selections: [
          { dimension: "admin.loginRecency" as const, key: "last30", label: dated.label },
        ],
      },
      lang: LANG,
    };
    expect(
      "selecting a dated bucket round-trips to the same count",
      await get("admin.accountsTotal").run(datedCtx),
      { value: dated.value }
    );
  }

  console.log(failures.length ? `\n${failures.length} FAILED` : "\nAll passed.");
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
