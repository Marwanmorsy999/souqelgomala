# Deployment (Cloudflare)

The app is built and deployed as a **Next.js application on Cloudflare Workers**
using `@cloudflare/next-on-pages`. `wrangler.jsonc` is the source of truth for
bindings.

---

## 1. Provision resources

```bash
# D1
wrangler d1 create souk-el-gomla-prod

# KV
wrangler kv namespace create CACHE

# R2 buckets (one per resource)
wrangler r2 bucket create souk-el-gomla-products
wrangler r2 bucket create souk-el-gomla-categories
wrangler r2 bucket create souk-el-gomla-offers
wrangler r2 bucket create souk-el-gomla-profiles
wrangler r2 bucket create souk-el-gomla-branches

# Queues
wrangler queues create souk-el-gomla-order-queue
wrangler queues create souk-el-gomla-notification-queue
```

Update `wrangler.jsonc` with the returned ids/names.

## 2. Set secrets

```bash
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put SESSION_SECRET
```

## 3. Migrate the database

```bash
wrangler d1 migrations apply DB --remote
# seed admin
SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD='...' pnpm seed:admin
wrangler d1 execute DB --remote --file=drizzle/seed-admin.sql
```

## 4. Build & deploy

```bash
pnpm build                 # Next build (uses @cloudflare/next-on-pages)
wrangler deploy            # or build via Cloudflare Pages/Workers CI
```

`wrangler.jsonc` `build.command` already runs `pnpm run build`.

## 5. Queue consumers

A Next.js app cannot host Cloudflare Queue consumers in the same compiled
worker. Deploy the standalone consumer worker described in
`src/lib/cloudflare/queue-consumer.ts` (uses `src/services/queues/*`). Wire the
queue bindings to that worker and its `queue(batch, env, ctx)` handler.

---

## Local deployment checks

- `pnpm dev` runs Next locally (bindings are local-only placeholders).
- `wrangler d1 migrations apply DB --local` provisions local D1.
- `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build` should pass.

## Environment notes

Secrets are **never** in `wrangler.jsonc` or client bundles. Public config is
`NEXT_PUBLIC_*`. See `docs/CLOUDFLARE.md` and `.env.example`.
