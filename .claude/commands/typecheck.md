# /typecheck

Run TypeScript type checking across all packages and apps without emitting files.

## Command

```bash
pnpm --filter @repo/shared typecheck && \
pnpm --filter @repo/db typecheck && \
pnpm --filter @repo/ai typecheck && \
pnpm --filter @repo/ui typecheck && \
pnpm --filter @repo/dashboard typecheck && \
pnpm --filter @repo/api typecheck && \
pnpm --filter @repo/widget typecheck && \
pnpm --filter @repo/marketing typecheck
```

Or run all at once via turbo:
```bash
npx turbo typecheck
```

## What to look for

- `error TS2345` — argument type mismatch (most common)
- `error TS2339` — property does not exist
- `error TS7006` — implicit `any` parameter
- `error TS2307` — cannot find module

## Fix approach

Fix errors from packages first (shared, db, ai, ui) before apps — apps depend on packages.
