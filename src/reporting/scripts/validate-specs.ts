import { superMetricRegistry } from "../metrics/admin";
import { metricRegistry, correctedMetrics } from "../metrics/registry";
import { adminReport } from "../spec/admin-report";
import { instituteReport } from "../spec/institute-report";
import { validateReportSpec } from "../spec/validate";

/**
 * Validates every report spec against the metric registry.
 * Run with: npx ts-node --compiler-options '{"module":"commonjs"}' src/reporting/scripts/validate-specs.ts
 */
const SPECS = [instituteReport, adminReport];

let failed = false;

for (const spec of SPECS) {
  const errors = validateReportSpec(spec);
  const tiles = spec.pages.reduce((n, p) => n + p.tiles.length, 0);
  if (errors.length) {
    failed = true;
    console.error(`FAIL ${spec.id}: ${errors.length} error(s)`);
    for (const e of errors) console.error(`  - ${e}`);
  } else {
    console.log(`OK   ${spec.id}: ${spec.pages.length} pages, ${tiles} tiles`);
  }
}

console.log(
  `\n${metricRegistry.size} institute metrics, ${superMetricRegistry.size} super metrics registered.`
);

const corrected = correctedMetrics();
console.log(`${corrected.length} metric(s) corrected vs the Power BI dashboard:`);
for (const m of corrected) console.log(`  - ${m.id}: ${m.powerBi!.note}`);

process.exit(failed ? 1 : 0);
