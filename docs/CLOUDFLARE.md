# Cloudflare Setup & Services

Everything the application needs from Cloudflare is declared in
`wrangler.jsonc` and consumed through the abstractions in `src/lib/cloudflare/`
and `src/services/`.

---

## Bindings

| Binding               | Type     | Purpose                                             |
| --------------------- | -------- | --------------------------------------------------- |
| `DB`                  | D1       | Relational database (source of truth)               |
| `CACHE`               | KV       | Feature flags, store settings, dashboard aggregates |
| `ORDER_QUEUE`         | Queue    | Post-order async processing                         |
| `NOTIFICATION_QUEUE`  | Queue    | Email / SMS / push dispatch                         |
| (secrets)             | —        | `TURNSTILE_SECRET_KEY`, `SESSION_SECRET`            |

## Secrets

Set with `wrangler secret put` (they are **never** in `wrangler.jsonc`):

```bash
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put SESSION_SECRET
```

Development copies live in local `.env.local`.

---

## Runtime (Workers vs Node)

The app is deployed with `@opennextjs/cloudflare`. Code paths:

- **Server components / Route Handlers / Server Actions** may touch D1,
  KV, Queues and Turnstile.
- **Client components** must never import `src/services/*` that touch
  bindings. Browser-only access is limited to `NEXT_PUBLIC_*` values.

`src/lib/env.ts` guards this with `assertServerOnly()`.

---

## Local development

Requires [Wrangler](https://developers.cloudflare.com/workers/wrangler/).

```bash
# 1. Apply schema to local D1
wrangler d1 migrations apply DB --local

# 2. Run the Next.js app (bindings are local-only values from wrangler.jsonc)
pnpm dev
```

> The current `wrangler.jsonc` uses placeholder ids (`local-cache-dev`,
> `local-dev-ref`). Replace them with real resource ids from
> `wrangler kv namespace create` / `wrangler d1 create` before remote deploy.

---

## Production

`@cloudflare/next-on-pages` compiles the Next build into a Worker. Bindings in
`wrangler.jsonc` are attached automatically. See `docs/DEPLOYMENT.md`.