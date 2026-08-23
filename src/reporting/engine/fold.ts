import type { BreakdownRow } from "../metrics/types";
import { MAX_DONUT_SEGMENTS, OTHER_FILL, SERIES } from "./palette";

/**
 * Folds a breakdown to at most `max` slices, gathering the tail into a single "Other".
 *
 * Never generate or cycle a 9th hue: past the palette's eight slots a new colour is
 * indistinguishable from an existing one under colour-vision deficiency, so the honest move is
 * to stop drawing categories rather than to invent colours for them. A donut is also only
 * readable as part-to-whole up to ~6 segments, which is why MAX_DONUT_SEGMENTS is the default.
 *
 * Pure, so it is unit-testable without a DOM.
 */
export function foldTail(
  rows: BreakdownRow[],
  max: number = MAX_DONUT_SEGMENTS,
  otherLabel = "Other"
): BreakdownRow[] {
  if (max < 2) throw new Error("foldTail needs room for at least one slice plus Other");
  if (rows.length <= max) return rows;

  const head = rows.slice(0, max - 1);
  const tail = rows.slice(max - 1);
  return [...head, { label: otherLabel, value: tail.reduce((sum, r) => sum + r.value, 0) }];
}

/**
 * The fill for slice `index`. "Other" is deliberately not a categorical slot -- it is not an
 * entity, so it must not look like one.
 */
export function sliceFill(index: number, label: string, otherLabel: string): string {
  if (label === otherLabel) return OTHER_FILL;
  return SERIES[index % SERIES.length];
}
