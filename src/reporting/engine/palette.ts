/**
 * Chart palette.
 *
 * These are the validated default categorical hues, in slot order. The ordering is the
 * colourblind-safety mechanism, not cosmetic -- it was chosen to maximise the minimum adjacent
 * CVD separation, so do not reorder or add to it. Verified with the palette validator against
 * the light surface: lightness band PASS, chroma floor PASS, worst adjacent CVD dE 24.2 (target
 * >= 12).
 *
 * The validator also flags aqua/yellow/magenta as below 3:1 contrast on a light surface, which
 * triggers the relief rule: any tile using these must ship visible labels or a table view. The
 * donut tile direct-labels every slice for exactly this reason -- the labels are an
 * accessibility requirement, not decoration.
 *
 * The portal is light-mode only (Ant Design 4 default), so only light steps are defined. If a
 * dark theme is ever added, dark steps must be *selected and re-validated* against the dark
 * surface, never derived by flipping these.
 */

/** Categorical slots, in fixed order. Never cycle past the end -- fold the tail into "Other". */
export const SERIES = [
  "#2a78d6", // 1 blue
  "#1baf7a", // 2 aqua
  "#eda100", // 3 yellow
  "#008300", // 4 green
  "#4a3aa7", // 5 violet
  "#e34948", // 6 red
  "#e87ba4", // 7 magenta
  "#eb6834", // 8 orange
] as const;

/** Single hue for one-series magnitude charts (bars, columns). */
export const SINGLE_HUE = SERIES[0];

/** Fill for the folded "Other" bucket -- deliberately not a categorical slot. */
export const OTHER_FILL = "#898781";

export const INK = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781", // axis + tick labels
  gridline: "#e1e0d9", // solid hairline, one shade off the surface
  baseline: "#c3c2b7",
  surface: "#fcfcfb",
} as const;

/**
 * A donut is only honest as part-to-whole at a glance, and only up to ~6 segments; past that,
 * adjacent slices blur and the palette runs out of safe hues. Beyond this many categories the
 * tail folds into a single "Other" slice.
 */
export const MAX_DONUT_SEGMENTS = 6;
