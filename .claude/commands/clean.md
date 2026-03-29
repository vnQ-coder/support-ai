# /clean

Clear all build caches, Turbopack output, and Turborepo cache to fix stale build issues.

## Full clean (recommended when builds behave unexpectedly)

```bash
find . -type d \( -name .next -o -name .turbo \) -not -path '*/node_modules/*' -exec rm -rf {} + 2>/dev/null || true
echo "✓ Cleaned .next and .turbo directories"
```

## Nuclear clean (when node_modules are suspect)

```bash
find . -type d -name .next -not -path '*/node_modules/*' -exec rm -rf {} + 2>/dev/null || true
find . -type d -name .turbo -not -path '*/node_modules/*' -exec rm -rf {} + 2>/dev/null || true
rm -rf node_modules
pnpm install
echo "✓ Full clean complete — run pnpm dev to restart"
```

## iCloud Drive cache fix (if seeing "slow filesystem" warnings)

```bash
find . -type d \( -name .next -o -name .turbo \) -not -path '*/node_modules/*' -exec xattr -w com.apple.fileprovider.ignore#P 1 {} + 2>/dev/null || true
echo "✓ iCloud exclusion applied"
```

## After cleaning

```bash
pnpm dev
```

First startup after clean will be slower (Turbopack recompiles everything). Subsequent starts will be fast again.
