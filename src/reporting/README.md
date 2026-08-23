# RIMS reporting

Replaces the 2024 Power BI dashboard (`LRI Dashboard v2.4.1.pbix`) with reports served from the
portal itself. Two audiences, two reports, one engine.

> Integrated onto portal `main` (React 19 / antd 5 / Next 15 / TypeScript 5.9; Prisma 4). The
> module was first built on `generic-portal`; the move to `main` needed only the metric/seed
> changes for the `instituteAdmin`-vs-member split and the new `instituteTopic` /
> `instituteMembershipInvitation` tables — the spec and engine layers were untouched by the
> schema change, which is the point of the split below.

| Report | Audience | Route | API |
|---|---|---|---|
| Institute | institute admins (`instituteAdmin`) | `/[institute]/reports/[page]` | `/api/reporting/[instituteId]/[pageId]` |
| RIMS administration | super admins (`account.is_super_admin`) | `/admin-reports/[page]` | `/api/reporting/admin/[pageId]` |

## The shape of it

```
spec/         what a report contains — pages, tiles, layout. Data, not code.
metrics/      how each number is computed. The ONLY layer that knows the schema.
engine/       how a tile is drawn. Knows nothing about RIMS.
auth/         who may read what.
scripts/      validate, seed, and verify.
```

Changing a report is a **spec edit**. Changing what a number means is a **metric edit**. When the
schema moves, `metrics/` (and the seed) is the only directory that should need touching — as the
`main` integration bore out.

**Institute admins need not be members** (since `f03e5d7`). `instituteAdmin` is keyed on
`(accountId, instituteId)` with no member row; do not assume admin ⊆ member. `auth/scope.ts` was
already correct (it reads `instituteAdmin.institute.urlIdentifier`), and the admin counts read
`instituteAdmin` directly, so both hold. The seed deliberately makes the sign-in admin a
non-member so this stays tested.

**Topics are institute-scoped** via `instituteTopic` (with `is_active`). This is a *curation*
layer — which topics an institute offers — separate from the topics already attached to records
through `product_topic` / `event_topic`, which are unchanged. "By topic" reports still count what
records actually carry, so they were unaffected.

## Rules that are load-bearing

**Authorization is server-side, always.** `PageAuthGuard` is a React component: it gates the UI,
not the data. Every reporting read goes through `auth/scope.ts`, which authorizes against the
caller's session. An institute named in a URL is a *request*, never permission. Do not copy
route patterns from `src/pages/api/` — those authenticate but do not authorize.

**Super admins cannot read institute member data.** `SUPER_ADMIN_CAN_READ_INSTITUTE_REPORTS` in
`auth/scope.ts` is `false`. Super admins administer institutes and monitor usage; making them
global readers of personal data is exactly what this design avoids. `SuperMetric` is a separate
type with no `instituteId` so the two can never be confused.

**Tenancy is two-tier.** `grant`/`event`/`supervision` carry `instituteId` (a `WHERE`);
`member`/`product`/`organization` are shared via join tables (a join). See `metrics/tenant.ts` —
the relation field names are not uniform.

**Counts count entities.** The Power BI dashboard counted join-table rows, so records were
multiplied by their linked-people count and records with none vanished. Corrected metrics keep
the old definition under `powerBi` so `parity-report.ts` can show what moved.

**A page's year filter scopes EVERY tile on that page**, via one `*Where(instituteId, filters)`
helper per metric module. A filter that moves only the by-year chart is worse than no filter,
because the other tiles then silently disagree with the control above them. Each page cuts one
natural date column, and `PageSpec.yearFilter.label` must name it:

| Page | Column | Label |
|---|---|---|
| Members | `date_joined` | Joined year |
| Products | `publish_date` | Publish year |
| Grants | `obtained_date` | Obtained year |
| Supervisions | `start_date` | Start year |
| Events | `start_date` | Start year |

Filtering a date column also drops rows where it is NULL — set an obtained year and grants never
obtained leave the page. That matches the Power BI slicers, and it is why the control is labelled
with the column rather than a bare "Years".

**Cross-filtering** (Power BI's click-a-mark-to-filter-everything) works through the same helpers.
A metric declares `dimension: DimensionId`; its rows carry a `key` (the database value, not the
label — a label is not a predicate, and `null` must round-trip as `IS NULL`); the entity's
`*Where` turns `{dimension, key}` back into a clause. To make a new tile clickable, give its
metric a `dimension` and emit `key` on its rows — the engine does the rest.

- Clicking a mark toggles it; clicking it again clears it. Chips above the grid show every active
  filter, plus "Clear all".
- Clicking a year column feeds the page's existing year range rather than a parallel mechanism,
  so the year inputs update to match and remain the single place to clear it.
- Selections AND together across dimensions, and are per-page — switching tabs clears them, since
  a product-type filter would be meaningless on Grants.
- The filter applies to the clicked tile too, rather than Power BI's cross-*highlight*. The
  selected mark stays at full strength and the rest recede to 25%.
- Only dimensions the page's own metrics declare are honoured server-side, so a hand-edited URL
  cannot filter by something the report does not offer.

The admin report cross-filters too: `admin.institute` (click an institute bar to scope the whole
Institutes page) and `admin.loginRecency` (click a bucket to scope the Adoption cards). Recency
bucket keys are stable ids (`last30`, `never`), never the label — a selection has to survive the
reader toggling language.

**Labels come from the database, in the reader's language.** Every RIMS lookup carries `name_en`
AND `name_fr`, and several entities carry both too (`event.name_*`, `organization.name_*`,
`product.title_*`). Metrics receive `lang` in their context and must:

- select with `selectNames` (id + both names) and label via `nameMap(rows, lang)` — never reach
  for `name_en` directly;
- pass `lang` to `labelGroups`, which also uses it for `localeCompare` so accented names sort
  correctly;
- translate any hardcoded label (peer reviewed, "(Blank)", status, login buckets) rather than
  writing English inline.

`lang` is required on `MetricContext`, so the compiler catches a metric that forgets it. Labels
are built server-side (that is where the lookup query lives), so language travels with the request
and toggling FR refetches. `parity-report.ts --fr` and `run-admin-metrics.ts --fr` print the
French labels as a quick check.

A person's name, an institute's name, and `grant.title` are NOT translated — the first two are
proper nouns and the third has no French column in the schema.

**Prisma 4 + SQL Server: never `count()` with a relation filter on a composite-key model.** It
emits a tuple `IN` that SQL Server rejects (error 4145). `findMany`/`groupBy` are fine. Aggregate
from the single-PK side instead. `scripts/probe-prisma.ts` re-checks this if Prisma is upgraded.

## Scripts

All are runnable with:
`npx ts-node@10 --compiler-options '{"module":"commonjs","esModuleInterop":true}' <script>`

They read `portal/.env` via `scripts/load-env.ts` (Prisma Client, unlike the Prisma CLI and
Next.js, does not read `.env` itself). A real `DATABASE_URL` in the environment still wins.

| Script | Does |
|---|---|
| `validate-specs.ts` | Every tile resolves to a metric of the right shape. No DB needed. **Run in CI.** |
| `test-fold.ts` | Donut folding rules. No DB needed. **Run in CI.** |
| `seed-test-db.ts` | Synthetic data that exposes the count bug + tenant isolation. **Test DB only — it deletes everything first.** Set `SEED_ADMIN_EMAIL` in `.env` to also seed a real sign-in account (super admin + institute admin of both institutes). |
| `parity-report.ts` | All metrics + the delta vs Power BI. `--no-assert` against real data. |
| `run-admin-metrics.ts` | All cross-institute metrics. |
| `probe-prisma.ts` | Which Prisma query shapes work on SQL Server. |

Local test database:

```bash
docker run -d --name rims-test -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD='RimsTest!2026dev' \
  -e MSSQL_PID=Developer -p 14330:1433 mcr.microsoft.com/mssql/server:2022-latest
# create database rims_test, then:
npx prisma db push --skip-generate
```

## Known gaps

**Usage reporting is not real telemetry.** RIMS records no audit events, so the Adoption page
reports how stale accounts are (`account.last_login`, a single overwritten date) — not how
heavily the system is used. Logins over time, page views, and who-edited-what need an audit
table and instrumentation at the mutating routes. That is the next real piece of work.

**Four Power BI measures are inferred, not ported.** `grant.Submission_date_calculated`,
`Obtained_date_calculated`, `Completed_date_calculated`, and `event.Notes_calculated` were DAX
measures. The pbix `DataModel` is XPress9-compressed and unreadable without Power BI Desktop, so
the grant milestone cards are implemented as "grants that reached this milestone". Confirm
against the original before anyone quotes them.

**The Members map is a ranked list.** No mapping dependency, and a bubble map compares counts
poorly. If geography itself matters, that is a contained follow-up.

**`/admin-reports` inherits the app's global institute-selection gate** (`InstituteGuard` in
`_app.tsx`), so a super admin must select some institute before viewing cross-institute reports.
Exempting that route is a one-line change, deliberately not made unilaterally.

**Charts add ~150 kB** (Recharts) for a ~499 kB first load. Fine for an admin-only page.

**Table columns** are declared per tile: `columns: [{key, label: {en, fr}, format?}]`. The list
also decides which keys are shown, so internal join ids stay out of the reader's way. Without it
a table falls back to raw object keys as headers — untranslated and ugly — so always declare
them. `parity-report.ts` asserts that every column key exists in what its metric returns, since
a typo would otherwise render a silently empty column. Numeric columns are right-aligned with
tabular figures automatically; `format: "currency"` renders CAD in the reader's locale.
