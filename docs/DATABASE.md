# Database — Cloudflare D1 + Drizzle

The relational database is **Cloudflare D1** accessed exclusively through
**Drizzle ORM**. There is no PostgreSQL / better-sqlite3 path anymore.

---

## Access

- `src/db/client.ts` — `createDb({ d1Binding })` produces a typed Drizzle
  instance; `getDb()` reads the `DB` binding from `globalThis`.
- `src/db/index.ts` — single entry point (schema + client + `db` singleton).
- Application code imports `getDb` from `@/db` and uses typed Drizzle queries.

```ts
import { getDb } from '@/db'
import { profiles } from '@/db/schema/auth'
import { eq } from 'drizzle-orm'

const row = await getDb().query.profiles.findFirst({
  where: eq(profiles.id, id),
})
```

## Schema

Defined once in `src/db/schema/` (one file per domain) — see
`docs/ARCHITECTURE.md §4` for the entity list. The authoritative DDL is
`drizzle/migrations/0001_initial_schema.sql`.

## Migrations

```
drizzle/migrations/0001_initial_schema.sql
drizzle/migrations/0002_seed_data.sql
```

Generate new migrations from schema changes:

```bash
pnpm drizzle-kit generate
```

Requires env: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`,
`CLOUDFLARE_D1_TOKEN` (see `drizzle.config.ts` with `driver: 'd1-http'`).

Apply:

```bash
wrangler d1 migrations apply DB --local
wrangler d1 migrations apply DB --remote
```

> D1 does not enforce foreign keys by default; the service/validation layer
> performs referential checks.

## Seeding

Base seed data (roles, branches, categories, sample products, feature flags)
is in `drizzle/migrations/0002_seed_data.sql`. Programmatic helpers for tests
live in `src/db/seed.ts` (`seedRoles`, `seedSettings`, `seedFeatureFlags`,
`seedCoreData`).

The first OWNER account is created with `scripts/seed-admin.ts` — see
`docs/AUTH.md`.

## File data belongs in R2 — not D1

D1 stores only R2 **object keys, metadata, and URLs**. Binary bytes are never
written to D1. See `docs/CLOUDFLARE.md` and `src/services/storage.ts`.
