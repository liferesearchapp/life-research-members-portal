This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Tests and CI

```bash
npm run test            # vitest, both projects
npm run test:coverage   # the same, plus coverage; writes coverage/ and enforces thresholds
npm run test -- --project components   # component tests only
```

Tests are split into two vitest projects, because the suites need different globals:

| Project | Files | Environment |
|---|---|---|
| `node` | `tests/**/*.test.ts`, `src/**/*.test.ts` | node |
| `components` | `tests/**/*.test.tsx` | jsdom, via `tests/setup/jsdom-setup.ts` |

A component test renders with `@testing-library/react` and asserts on the DOM; see
`tests/components/nav-menu.test.tsx`. The setup file registers the jest-dom matchers, unmounts
between tests, and stubs `matchMedia` and `ResizeObserver`, which jsdom does not implement and
antd requires. Those stubs report no real size, so a component test must not assert on responsive
behaviour or on which items antd decided to overflow.

Two GitHub Actions jobs run on every pull request (`.github/workflows/ci.yml`):

- **`check`** -- typecheck, lint, unit tests with coverage thresholds, the two database-free
  reporting checks, and a production build.
- **`reporting-integration`** -- stands up a real SQL Server, pushes the schema, seeds a
  deterministic fixture, and runs the reporting parity and cross-institute assertions. Metric
  correctness lives in SQL, which unit tests with a mocked Prisma cannot see. See
  [src/reporting/README.md](src/reporting/README.md).

Coverage is deliberately scoped to the logic that can be unit-tested without a DOM, and its
thresholds are a ratchet against regression rather than a claim of good coverage. What is out of
scope, and what verifies each of those areas instead, is documented in `vitest.config.mts`.

## Audit log

Every request that changes data, and every read of a `private` (personal-data) route, is recorded
in the `auditEvent` table: who acted, what route, which `[id]`, the method, and the status it
ended with. Refusals are recorded too — a run of denied attempts is exactly what an audit is for.

The log exists to make sequences visible. A single request is usually unremarkable; the pattern
that motivated this (issue #12) was an institute admin adding a member, using the edit rights that
grants, and removing them again, where every individual step looks legitimate on its own.

A route opts in by wrapping its handler, and `tests/api/route-authorization.test.ts` requires that
wrapper on every route that mutates or serves personal data, so a new route cannot quietly skip it:

```ts
export default withAudit(handler, { action: "update-account/[id]/grant-admin" });
```

**The table is append-only.** A trigger refuses `UPDATE` outright, and refuses `DELETE` unless the
session has deliberately opted in, so no application code path can rewrite history — including
code written by whoever is being audited. A retention purge is therefore an explicit act:

```sql
EXEC sp_set_session_context @key = N'audit_purge', @value = N'1';
DELETE FROM [dbo].[auditEvent] WHERE [occurred_at] < DATEADD(year, -2, SYSUTCDATETIME());
EXEC sp_set_session_context @key = N'audit_purge', @value = NULL;
```

Two properties worth knowing before relying on it:

- **Logging fails open.** If the log write fails, the request still succeeds and the failure goes
  to the server log. A logging outage does not take the portal down, and the trade is that events
  can be lost. Making it fail closed is a policy decision; `record()` in `src/utils/api/audit.ts`
  is the one place to change.
- **The rows are personal data.** They name who did what, and when. Access to the table deserves
  the same treatment as access to the accounts it describes, and a retention period should be
  agreed rather than assumed.

`npm run audit:check` verifies all of this against a real SQL Server, and runs in CI.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
