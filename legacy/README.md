# Legacy / Archived

This directory holds infrastructure that is **no longer used** by the production
application. It is retained only for reference.

## `legacy/supabase/`

The original Supabase PostgreSQL schema, migrations, storage and edge functions.
The project has migrated to a **100% Cloudflare-first architecture**:

- Relational data  → Cloudflare D1 + Drizzle ORM
- File storage     → Cloudflare R2
- Caching/flags    → Cloudflare KV
- Async jobs       → Cloudflare Queues
- Auth             → Web Crypto (PBKDF2) sessions in D1
- Realtime         → SSE endpoint backed by D1

**Do not reference anything in this directory from application code.**
The active D1 schema lives in `drizzle/migrations/` and `src/db/schema/`.
These Supabase files are archived for reference only and can be deleted once
the team is confident the D1 migration is complete.