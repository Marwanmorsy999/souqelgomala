# Souk El Gomla — Architecture

A 100% **Cloudflare-first** retail management platform (customer storefront +
admin dashboard) built on **Next.js App Router** deployed to Cloudflare.

> ⚠️ Supabase has been **completely removed**. Do not reintroduce Supabase
> (PostgreSQL, Auth, Realtime, Storage, or `@supabase/*` packages). Everything
> runs on Cloudflare Workers bindings.

---

## 1. High-Level Flow

```
Browser (RTL, Arabic-first)
        │
        ▼
Next.js App Router (deployed on Cloudflare via @cloudflare/next-on-pages)
        │
        ▼
Services layer
   ├── D1 + Drizzle ORM   → relational data (source of truth)
   ├── R2                 → images/files
   ├── KV                 → cache + feature flags
   ├── Queues             → async jobs (order & notification processing)
   └── Turnstile          → abuse/bot protection
```

The customer-facing store and the admin dashboard live in the **same Next.js
application**. The difference is only the route namespace (`app/` vs
`app/admin/`) and the auth guard on the admin routes.

---

## 2. Service Responsibilities

| Service            | Responsibility                                                                 |
| ------------------ | ------------------------------------------------------------------------------ |
| **D1 + Drizzle**   | The only relational database. All business entities (profiles, orders, products, customers, inventory, suppliers, returns, feature flags…). Drizzle ORM gives typed queries. |
| **R2**             | Object storage for images/files. D1 stores only the R2 object **key + metadata** — never binary data. Signed/public URLs served to clients. |
| **KV**             | Cache-aside layer: feature flags, store settings, dashboard aggregates, short-lived caches. **Not** a primary database. |
| **Queues**         | Asynchronous follow-up work (ORDER_QUEUE, NOTIFICATION_QUEUE) that must not block a customer request. |
| **Turnstile**      | Invisible abuse/bot check on login and sensitive public forms. Verified **server-side** only. |
| **Web API / SSE**  | Realtime push channel at `/api/realtime`. D1 remains the durable source of truth. |

### 2.1 Why these choices

- **D1** — SQLite-compatible, so the same Drizzle schema/query model works
  locally and in production.
- **R2** — cost-effective S3-compatible object storage with Zero Egress fees.
- **KV** — low-latency reads for frequently-accessed configuration.
- **Queues** — resilient async processing without a separate message broker.
- **SSE** — simple, one-directional push for live dashboards; D1 guarantees no
  data loss on reconnect.

---

## 3. Repository Layout

```
app/
  admin/                 # Admin dashboard (protected by requireAuth)
  api/
    auth/me,login,logout # Session endpoints
    realtime/            # SSE endpoint
components/
  layout/                # AppShell, sidebar, topbar, shell-context
src/
  db/
    schema/              # Drizzle tables (one file per domain)
    client.ts            # D1 + Drizzle client factory
    index.ts             # Single DB entry point
    seed.ts              # Programmatic seed helpers
    migrations/          # D1 migration workflow docs
  lib/
    cloudflare/          # Cloudflare-specific code (r2, kv, queues, queue-consumer)
    crypto.ts            # Web Crypto password/session helpers (pure)
    permissions.ts       # Server-side RBAC
    env.ts               # Type-safe env access
  services/
    auth.ts              # Session auth (server actions + helpers)
    storage.ts           # R2 storage facade
    turnstile.ts         # Turnstile verification
    api-response.ts      # API response helpers
    queues/              # Queue consumer business logic
  types/
    database.ts          # Shared domain types (Role aliased to schema)
```

Cloudflare-specific code is isolated in `src/lib/cloudflare/`; business logic
lives in `src/services/` and is framework/Cloudflare-agnostic.

---

## 4. Data Model

Entities (preserved from the original design, now in D1):

- **Auth:** `roles`, `profiles`, `sessions`, `auth_audit_logs`
- **Branches:** `branches`
- **Catalog:** `categories`, `products`, `product_images`, `product_tags`
- **Customers:** `customers`, `customer_addresses`
- **Orders:** `orders`, `order_items`, `order_status_history`, `order_timeline`
- **Offers:** `offers`
- **Delivery:** `delivery_drivers`, `delivery_areas`, `delivery_assignments`
- **Operations:** `activity_logs`, `notifications`, `settings`
- **Suppliers:** `suppliers`, `purchase_orders`, `purchase_order_items`
- **Inventory:** `inventory_movements`
- **Returns:** `returns`, `return_items`
- **Feature flags:** `feature_groups`, `feature_flags`

The authoritative DDL is in `drizzle/migrations/0001_initial_schema.sql`.
Schema is defined once in `src/db/schema/` and used by Drizzle.

---

## 5. Authentication & Authorization

- **No Supabase Auth.** Passwords hashed with **PBKDF2 (SHA-256, 100k iters)**
  via `src/lib/crypto.ts`.
- **Sessions:** opaque bearer token in an HttpOnly, Secure, SameSite=Lax cookie.
  Only the **SHA-256 hash** of the token is stored in D1.
- **RBAC** replaces RLS. Every protected mutation validates:
  1. authenticated session (`requireAuth`)
  2. role (owner / manager / employee)
  3. permission (via `src/lib/permissions.ts`)
  4. input schema (Zod)

See `docs/AUTH.md`.

---

## 6. Realtime

- `/api/realtime` is an SSE endpoint polling D1.
- There is **no durable pub/sub**: SSE is a low-latency push hint.
- Durable events (notifications, order history) are written to D1, so a
  reconnecting client can catch up by querying D1.

See `docs/REALTIME.md`.

---

## 7. Deployment

Deployment target = **Cloudflare Workers** via `@cloudflare/next-on-pages`,
configured in `wrangler.jsonc` (D1 `DB`, KV `CACHE`, R2 buckets, Queues,
cron triggers). See `docs/DEPLOYMENT.md` and `docs/CLOUDFLARE.md`.

---

## 8. Engineering Rules

1. Do not reintroduce Supabase.
2. No Node-only database libraries in the Worker runtime.
3. Never trust the client for authorization.
4. No secrets in client bundles.
5. Don't use KV as the primary database.
6. Don't store file bytes in D1.
7. One canonical role/permission system.
8. Validate every external input with Zod.
9. Business logic stays independent of Cloudflare APIs.
10. Cloudflare-specific code stays under `src/lib/cloudflare/`.