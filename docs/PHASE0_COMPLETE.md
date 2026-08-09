> **⚠️ SUPERSEDED** — This Phase-0 / Milestone-1 document describes the **Supabase** implementation (including @supabase/* setup). That architecture was fully replaced by a **100% Cloudflare-first** stack (D1 + Drizzle, R2, KV, Queues, Turnstile). See docs/CLOUDFLARE.md, docs/DATABASE.md, and docs/ARCHITECTURE.md for the current design. The original Supabase files are archived under legacy/supabase/ and are for reference only.

# Phase 0 — Foundation & Supabase Setup ✅

## Delivered Files

### Database (Supabase)

| File | Description |
|------|-------------|
| `supabase/migrations/001_initial_schema.sql` | Full schema: 19 tables, enums, indexes, triggers, RLS policies, realtime |
| `supabase/migrations/002_seed_data.sql` | Realistic Egyptian grocery seed data (branches, categories, products, customers, orders, drivers, offers, settings) |
| `supabase/migrations/003_storage.sql` | Storage buckets + public read + staff write + manager delete policies |
| `supabase/README.md` | Step-by-step setup guide (link project, push, create admin, buckets, types) |

### Schema Highlights

- **UUID PKs** everywhere, `created_at`/`updated_at` timestamps, `deleted_at` soft-delete on all business tables
- **Audit trail**: `activity_logs` (all actions) + immutable `order_status_history`
- **Order numbering**: auto-generated `SG-YYYYMMDD-000001` via DB trigger
- **Customer metrics**: `total_spending`, `average_order`, `order_count` auto-recalculated on order insert/update
- **Performance**: 40+ indexes, trigram search on product names, partial indexes for low-stock/featured
- **RLS**: `is_staff()`, `has_role()`, `has_any_role()` security-definer helpers; policies per table per role
- **Realtime**: `orders`, `order_status_history`, `products`, `activity_logs`, `notifications`
- **Future-ready**: `settings` KV store, `notifications`, schema supports inventory/suppliers/PO/loyalty expansion

### TypeScript Types

| File | Description |
|------|-------------|
| `src/types/database.ts` | Typed DB row interfaces + composite types (OrderWithItems, ProductWithRelations, DashboardStats) |
| `src/types/database.generated.ts` | Placeholder for `supabase gen types` output |
| `src/types/entities.ts` | Domain models (OrderDetail, ProductFormValues, CustomerProfile, QueryTableState) |
| `src/types/cloudflare.ts` | Future-ready R2/KV/Queues/Turnstile/Cache/WAF interfaces |

### Supabase Clients

| File | Description |
|------|-------------|
| `src/services/supabase-client.ts` | Browser client (`createBrowserClient`), session helpers |
| `src/services/supabase-server.ts` | Server client (`createServerClient` w/ cookies) + service-role client (server-only) |
| `src/services/storage.ts` | Upload/delete/list image helpers with typed buckets |

### Config & Utilities

| File | Description |
|------|-------------|
| `.env.example` | Complete env template with placeholders (Supabase + Cloudflare future) |
| `src/lib/env.ts` | Type-safe env access with fail-fast validation |
| `src/lib/constants.ts` | Order status flow/labels, payment methods, pagination, date ranges |
| `src/lib/permissions.ts` | RBAC permission matrix + route guards |
| `src/lib/format.ts` | Arabic number/currency/date/relative-time/phone formatting |
| `src/config/routes.ts` | Central admin route registry |
| `src/config/sidebar.ts` | Sidebar navigation tree with permissions |
| `src/config/query-keys.ts` | TanStack Query key factories |

### Shared Hooks

| File | Description |
|------|-------------|
| `src/hooks/use-debounce.ts` | Debounced value hook |
| `src/hooks/use-media-query.ts` | Responsive breakpoint hooks |
| `src/hooks/use-keyboard-shortcut.ts` | ⌘K-style shortcuts with input-ignore |
| `src/hooks/use-realtime.ts` | Supabase Realtime → query invalidation bridge |
| `src/hooks/use-auth.ts` | Session/profile/role state + logout |

### Other

- `tsconfig.json` — updated `@/*` paths to include `./src/*`
- Dependencies added: `@supabase/supabase-js`, `@supabase/ssr`

## Verification

- `tsc --noEmit` passes for all new `src/` files
- The only 4 type errors are in pre-existing demo components (`components/admin-dashboard.tsx`, `components/products-management.tsx`) which predate Phase 0 and will be replaced by feature modules in later phases

## Ready for Phase 1

Phase 1 will build: Auth UI (login), admin layout (sidebar + topbar), auth guard middleware, and RBAC context.

