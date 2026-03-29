# /test

Run Vitest unit tests across the SupportAI monorepo.

## Commands

Run all tests:
```bash
npx turbo test
```

Run with watch mode (during development):
```bash
pnpm --filter @repo/shared test -- --watch
```

Run with coverage:
```bash
npx turbo test -- --coverage
```

Run a specific test file:
```bash
pnpm --filter @repo/shared test -- src/stripe.test.ts
```

## Test locations

- `packages/shared/src/__tests__/` — utility, schema, and business logic tests
- `packages/db/src/__tests__/` — query helper tests
- `packages/ai/src/__tests__/` — AI prompt and RAG tests
- `apps/*/src/__tests__/` — app-specific tests

## Test standards

- Unit tests only (no DB calls, no network) — mock at boundaries
- Use `vi.mock()` for external modules (Stripe, Clerk, Drizzle)
- Every Zod schema must have at least valid + invalid test cases
- Every Server Action must have a unit test
