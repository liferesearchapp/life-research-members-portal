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
npm run test            # vitest unit tests
npm run test:coverage   # the same, plus coverage; writes coverage/ and enforces thresholds
```

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
