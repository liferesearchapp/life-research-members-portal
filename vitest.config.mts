import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],

    coverage: {
      provider: "v8",

      // `all` counts files that no test imports, so a module with no test at all shows up as 0%
      // rather than vanishing from the denominator and flattering the total.
      all: true,

      // Scope: the logic that can be unit-tested without a DOM. Everything outside it is verified
      // some other way, and folding it in here would drown the signal rather than add to it:
      //
      //  - `**/*.tsx` -- React components. There is no component-test infra yet (jsdom + Testing
      //    Library, tracked in #29), so every one of the 233 of them would read as 0%.
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
      include: ["src/utils/**/*.ts", "src/components/navbar/**/*.ts"],
      exclude: ["**/*.test.ts"],

      reporter: ["text-summary", "html", "lcov", "json-summary"],

      // Ratchet, not an aspiration. Measured when coverage was introduced: 42.22% statements and
      // lines (209/495), 77.06% branches (84/109), 41.93% functions (13/31); the floors sit a
      // couple of points under that, since v8's counts can shift slightly between Node versions
      // and CI runs Node 20 while a developer may not.
      //
      // They exist to catch a regression -- a helper losing its test, or new untested code landing
      // in this layer -- not to claim the layer is well covered. It is not: every helper under
      // `utils/front-end` is at 0. Raise these as that changes.
      thresholds: {
        statements: 40,
        lines: 40,
        functions: 40,
        branches: 75,
      },
    },
  },
});
