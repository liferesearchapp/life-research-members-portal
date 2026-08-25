import { foldTail, sliceFill } from "../engine/fold";
import { MAX_DONUT_SEGMENTS, OTHER_FILL, SERIES } from "../engine/palette";
import type { BreakdownRow } from "../metrics/types";

/** Checks the donut folding rules. Pure logic, no DOM. */

const failures: string[] = [];
function check(label: string, actual: unknown, expected: unknown) {
  const [a, e] = [JSON.stringify(actual), JSON.stringify(expected)];
  if (a === e) console.log(`  ok    ${label}`);
  else {
    failures.push(label);
    console.log(`  FAIL  ${label}\n          expected ${e}\n          got      ${a}`);
  }
}

const rows = (...values: number[]): BreakdownRow[] =>
  values.map((value, i) => ({ label: `C${i + 1}`, value }));

console.log("foldTail");

// At or under the cap, nothing is folded.
check("6 categories pass through untouched", foldTail(rows(6, 5, 4, 3, 2, 1), 6), rows(6, 5, 4, 3, 2, 1));
check("empty passes through", foldTail([], 6), []);

// Over the cap, the tail collapses into one Other whose value is the tail's sum.
check("9 categories fold to 6", foldTail(rows(20, 14, 11, 9, 6, 4, 3, 2, 1), 6), [
  { label: "C1", value: 20 },
  { label: "C2", value: 14 },
  { label: "C3", value: 11 },
  { label: "C4", value: 9 },
  { label: "C5", value: 6 },
  { label: "Other", value: 10 }, // 4+3+2+1
]);

// The fold must be value-preserving: no row may be silently dropped.
const many = rows(20, 14, 11, 9, 6, 4, 3, 2, 1);
const sum = (rs: BreakdownRow[]) => rs.reduce((s, r) => s + r.value, 0);
check("total is preserved by folding", sum(foldTail(many, 6)), sum(many));

check("custom Other label is used", foldTail(rows(5, 4, 3), 2, "Autre"), [
  { label: "C1", value: 5 },
  { label: "Autre", value: 7 },
]);

console.log("\nsliceFill");
check("slot 1 is the first categorical hue", sliceFill(0, "C1", "Other"), SERIES[0]);
check("Other never takes a categorical slot", sliceFill(5, "Other", "Other"), OTHER_FILL);
check(
  "a folded donut never exceeds the palette",
  foldTail(rows(9, 8, 7, 6, 5, 4, 3, 2, 1), MAX_DONUT_SEGMENTS).length <= SERIES.length,
  true
);

console.log(failures.length ? `\n${failures.length} FAILED` : "\nAll passed.");
process.exit(failures.length ? 1 : 0);
