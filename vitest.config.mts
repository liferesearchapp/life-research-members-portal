import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json sets `jsx: "preserve"`, which is right for Next but leaves esbuild handing raw
  // JSX to the runtime. Component tests need it actually compiled.
  esbuild: { jsx: "automatic" },

  test: {
    // Two projects, because the suites need different globals. The API and logic tests run in
    // Node, as they always have; only the component tests pay for a jsdom document.
    projects: [
      {
        esbuild: { jsx: "automatic" },
        test: {
          name: "node",
          include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        esbuild: { jsx: "automatic" },
        test: {
          name: "components",
          include: ["tests/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./tests/setup/jsdom-setup.ts"],
        },
      },
    ],

    coverage: {
      provider: "v8",

      // `all` counts files that no test imports, so a module with no test at all shows up as 0%
      // rather than vanishing from the denominator and flattering the total.
      all: true,

      // Scope: the logic that can be unit-tested without a DOM. Everything outside it is verified
      // some other way, and folding it in here would drown the signal rather than add to it:
      //
      //  - `**/*.tsx` outside the navbar -- React components. jsdom + Testing Library now exist,
      //    but only the navbar has tests, so the other ~225 components would still read as 0%.
      //    The scope grows as components gain tests; it is not a permanent exemption.
      //  - `src/pages/api/**` -- the API routes are thin Prisma wrappers whose security-relevant
      //    behaviour is the authorization call at the top. `tests/api/route-authorization.test.ts`
      //    asserts structurally that *every* route makes one or is on a documented public
      //    allowlist, which is a stronger guarantee than a line percentage over 83 files.
      //  - `prisma/helpers.ts` -- declarative `select` projections, not logic. It reports 100%
      //    merely by being imported, and at 539 statements it would be over half this scope,
      //    hiding real movement elsewhere. Its actual guard is
      //    `tests/api/public-projections-pii.test.ts`, which asserts on its contents.
      //  - `src/reporting/**` -- verified against a real SQL Server by the `reporting-integration`
      //    CI job, not by vitest. Counting it here would mark the most thoroughly checked code in
      //    the repo as untested.
      include: ["src/utils/**/*.ts", "src/components/navbar/**/*.{ts,tsx}"],
      exclude: ["**/*.test.ts"],

      reporter: ["text-summary", "html", "lcov", "json-summary"],

      // Ratchet, not an aspiration. Measured: 32.62% statements and lines (291/892), 78.16%
      // branches (111/142), 39.02% functions (16/41); the floors sit a point or two under that,
      // since v8's counts can shift between Node versions and CI runs Node 20.
      //
      // The statement figure went *down* when the navbar components entered the scope above (from
      // 42.22% over 495 statements). That is the intended direction: the drop is untested code
      // becoming visible, not coverage being lost. Widening the scope and watching the number fall
      // is how this grows -- do not restore the number by narrowing the scope again.
      //
      // These catch a regression -- a helper losing its test, or new untested code landing in
      // scope -- and are not a claim that the layer is well covered. It is not: every helper under
      // `utils/front-end` sits at 0, as do the navbar components other than nav-menu.
      thresholds: {
        statements: 31,
        lines: 31,
        functions: 37,
        branches: 76,
      },
    },
  },
});
