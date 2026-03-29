# /lint

Run ESLint across the entire SupportAI monorepo.

## Command

```bash
npx turbo lint
```

Or for a specific app:
```bash
pnpm --filter @repo/dashboard lint
pnpm --filter @repo/api lint
pnpm --filter @repo/marketing lint
pnpm --filter @repo/widget lint
```

## Auto-fix safe rules

```bash
npx turbo lint -- --fix
```

## Common issues in this codebase

- `react-hooks/exhaustive-deps` — missing useEffect dependencies
- `@next/next/no-img-element` — use `next/image` instead of `<img>`
- `no-unused-vars` — remove unused imports
- `@typescript-eslint/no-explicit-any` — replace `any` with proper types
