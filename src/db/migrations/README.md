# Database Layer — src/db/

## Layout

```
src/db/
  client.ts        Drizzle client factory (Cloudflare D1 binding)
  index.ts         Single entry point (schema + client)
  schema/          Drizzle table definitions (one file per domain)
  migrations/      Cloudflare D1 migration notes / workflow
  seed.ts          Programmatic seed helpers (roles, settings, feature flags)
```

## D1 migrations

The actual SQL migration files live in **`drizzle/migrations/`** at the repository
root (`0001_initial_schema.sql`, `0002_seed_data.sql`). This is the folder
`drizzle-kit generate` writes to and Wrangler applies from.

### Generate a new migration (after schema changes)

```bash
pnpm drizzle-kit generate        # writes SQL into drizzle/migrations
```

drizzle-kit is configured in `drizzle.config.ts` with the `d1-http` driver.
Set these environment variables when running against a remote database:

```bash
export CLOUDFLARE_ACCOUNT_ID=...
export CLOUDFLARE_DATABASE_ID=...
export CLOUDFLARE_D1_TOKEN=...
```

### Apply migrations to local D1

```bash
wrangler d1 migrations apply DB --local
```

### Apply migrations to production D1

```bash
wrangler d1 migrations apply DB --remote
```

> D1 does not enforce foreign keys by default. On fresh production databases
> run `PRAGMA foreign_keys = ON;` as the first statement (it must be set per
> connection). The application layer performs its own referential checks anyway.

## Seed data

Base seed data (roles, branches, categories, sample products, feature flags)
is part of `drizzle/migrations/0002_seed_data.sql` and is applied through the
normal migration process.

Programmatic helpers for test fixtures live in `seed.ts`.

### First OWNER account

Never register admins through a public page. Create the initial owner account
with the dedicated script:

```bash
SEED_ADMIN_EMAIL=owner@example.com SEED_ADMIN_PASSWORD='change-me' pnpm seed:admin
```

See `scripts/seed-admin.ts` and `docs/AUTH.md` for details.