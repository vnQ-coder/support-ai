# /db-migrate

Run a safe Drizzle ORM schema migration for the SupportAI database.

## Steps

1. Check Docker is running: `docker ps | grep copilot-postgres`
2. Generate migration files: `cd packages/db && DATABASE_URL=postgresql://copilot:copilot@localhost:5433/supportai pnpm generate`
3. Review the generated SQL in `packages/db/drizzle/` before applying
4. Apply migration: `cd packages/db && DATABASE_URL=postgresql://copilot:copilot@localhost:5433/supportai pnpm migrate`
5. Verify tables: `docker exec copilot-postgres psql -U copilot -d supportai -c "\dt"`

## If migration fails

- Check for conflicting column names or type changes
- For destructive changes, back up data first: `docker exec copilot-postgres pg_dump -U copilot supportai > backup.sql`
- To rollback: restore from backup or write a reverse migration

## Safety rules

- Never run `pnpm push` in production (use `pnpm migrate` with generated SQL)
- Always review generated SQL before applying
- Test on a branch/preview DB before production (use Neon branching in production)
