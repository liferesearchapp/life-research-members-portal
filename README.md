# RIMS — Research Information Management System

**Every research institute knows the feeling: the grant total lives in one spreadsheet, the
publication list in another, the student supervisions in somebody's inbox, and the annual report
takes three weeks to assemble from all of it.**

RIMS is the answer to that. One place where a research institute's people, outputs, funding,
partnerships and training all live together — kept current by the researchers themselves, visible
to the public where it should be, and private where it must be. When the annual report is due, the
numbers are already there.

Built for the [LIFE Research Institute](https://www.uottawa.ca/research-innovation/life) at the
University of Ottawa, and now multi-institute: **one deployment serves many institutes**, each with
its own members, its own data, and its own look.

---

## What it holds

Six kinds of record, each with a public face and a private one:

| | |
|---|---|
| **Members** | Researchers and their profiles — faculty, research interests, keywords, the problems they work on, contact details, and links out to their CV, website and socials |
| **Products** | What the research produced — journal articles, books and chapters, conference papers, datasets — with authors, topics and target audiences |
| **Grants** | Funding, from application through to completion, with sources, statuses, amounts, and the people involved |
| **Events** | Talks, workshops and gatherings, with partners, members involved, and the products that came out of them |
| **Supervisions** | Graduate training: trainees, levels, principal supervisors, co-supervisors and committees |
| **Partners** | The organizations the institute works with, by type and by scope |

Everything is connected. A grant knows its investigators; a product knows its authors; an event
knows what it produced. Follow any thread and the rest of the picture comes with it.

---

## What makes it different

### 📊 Reports that are always current

Six pages of institute reporting and a cross-institute view for administrators — members by
faculty, products by type and year, grants by source, supervisions by level, partnerships by scope.
**Not an export. Not a nightly refresh.** The reports query live data with the reader's own
permissions, so an institute admin sees exactly their institute, and nothing else.

Click a slice — a faculty, a product type, a year — and the whole page narrows to it. Selections
combine, so "datasets, in engineering, since 2020" is three clicks rather than a query.

This replaced a Power BI dashboard, and **corrected eight figures on the way**. The old numbers
counted each product once per author, and silently dropped anything with no author attached. The
new ones count the work.

### 🏛 Many institutes, one system

Institutes share what should be shared and keep separate what should not. A researcher who belongs
to two institutes is *one* member with one profile, not two copies drifting apart. A product
co-produced by three institutes is one product, visible to all three. Grants, events and
supervisions belong to the institute that owns them, and stay there.

Each institute brings its own name, logos and colours, and the interface takes them on.

### 🌐 Bilingual, properly

English and French throughout — every label, every report, every form, switchable at any moment.
Not a translation layer bolted on, but two languages carried in the data model itself.

### 🔓 Public where it helps, private where it matters

Public profiles let the world find your researchers and their work; no login, no barrier. Behind
sign-in sits everything that should not be public — home contact details, interview notes, internal
comments — separated at the query level, so a public page cannot accidentally serve a private
field.

### 🔐 Access you can reason about

Microsoft sign-in, and three roles that mean what they say: **super admins** run the system,
**institute admins** run their own institute, **members** manage their own profile. Rights are
per-institute, and administering an institute does not silently make you a member of it.

Every one of the **83 API routes** authenticates, or is on a reviewed list of things that are
public on purpose, with the reason written down. That is not a promise — it is a test that fails
the build.

---

## See it running

| | |
|---|---|
| **Operational** | [life-research.herokuapp.com](https://life-research.herokuapp.com/) — the live system |
| **Sandbox** | Vercel — for trying things out; see the [wiki](https://github.com/liferesearchapp/life-research-members-portal/wiki/Deployment-on-Vercel) |

---

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

You will need a `DATABASE_URL` for a SQL Server database. For a throwaway one:

```bash
docker run -d --name rims-test -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD='RimsTest!2026dev' \
  -e MSSQL_PID=Developer -p 14330:1433 mcr.microsoft.com/mssql/server:2022-latest
npm run db:push   # creates the database and syncs the schema
npm run db:seed   # fills it with realistic synthetic data
```

`npm run db:seed` builds four institutes and a few hundred connected records, so the app and its
reports have something to show immediately. It refuses to run against anything but a local
database.

Full setup, including Microsoft sign-in, is in
[Local Development](https://github.com/liferesearchapp/life-research-members-portal/wiki/Local-Development).

---

## Built with

**Next.js 15** (Pages Router) · **React 19** · **TypeScript** · **Ant Design 5** · **Prisma** ·
**SQL Server** · **Recharts** · **MSAL** for Microsoft sign-in

---

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

- **`check`** — typecheck, lint, unit tests with coverage thresholds, the two database-free
  reporting checks, and a production build.
- **`reporting-integration`** — stands up a real SQL Server, pushes the schema, seeds a
  deterministic fixture, and runs the reporting parity and cross-institute assertions. Metric
  correctness lives in SQL, which unit tests with a mocked Prisma cannot see. See
  [src/reporting/README.md](src/reporting/README.md).

Coverage is deliberately scoped to the logic that can be unit-tested without a DOM, and its
thresholds are a ratchet against regression rather than a claim of good coverage. What is out of
scope, and what verifies each of those areas instead, is documented in `vitest.config.mts`.

Some properties are enforced structurally rather than case by case: every API route must gate
access or be explicitly public, and every route must declare the HTTP methods it accepts as its
first act. Add a route without either and CI tells you, naming the fix.

---
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

## Documentation

The [project wiki](https://github.com/liferesearchapp/life-research-members-portal/wiki) covers it
in depth:

| Page | For |
|---|---|
| [Local Development](https://github.com/liferesearchapp/life-research-members-portal/wiki/Local-Development) | Setting up and adding a feature |
| [Continuous Integration](https://github.com/liferesearchapp/life-research-members-portal/wiki/Continuous-Integration) | Every check that runs, and what it catches |
| [Reporting](https://github.com/liferesearchapp/life-research-members-portal/wiki/Reporting) | How reports are built, and why the numbers changed |
| [Security Model](https://github.com/liferesearchapp/life-research-members-portal/wiki/Security-Model) | What protects a route, in the order it runs |
| [Backend](https://github.com/liferesearchapp/life-research-members-portal/wiki/Backend) | All 83 endpoints, and how to add one |
| [Frontend](https://github.com/liferesearchapp/life-research-members-portal/wiki/Frontend) | Pages, components, contexts and services |
| [Database](https://github.com/liferesearchapp/life-research-members-portal/wiki/Database) · [Prisma](https://github.com/liferesearchapp/life-research-members-portal/wiki/Prisma) | Schema, migrations and queries |
| [Authentication](https://github.com/liferesearchapp/life-research-members-portal/wiki/Authentication) | Sign-in, roles and authorization helpers |

---

## Contributing

Pull requests need a green build and one review. `main` is protected; a merge to it deploys to the
operational system, so treat approval as shipping.
