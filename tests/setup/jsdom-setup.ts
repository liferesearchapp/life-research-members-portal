import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Setup for the `components` test project (jsdom).
 *
 * Unmounts anything a test rendered, so one test's DOM cannot leak into the next.
 */
afterEach(cleanup);

/**
 * jsdom implements neither API, and antd reaches for both: `matchMedia` for its responsive
 * breakpoints, `ResizeObserver` (via rc-overflow) for the horizontal Menu that decides how many
 * items fit before collapsing into the "..." indicator. Without these, rendering a Menu throws
 * rather than failing an assertion, which reads as a broken test rather than a missing polyfill.
 *
 * These are stubs, not implementations: nothing here reports a real size, so a test must not
 * assert on responsive behaviour or on which items overflowed. Assert on what was rendered.
 */
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
