> **⚠️ MIGRATED TO CLOUDFLARE** — Sections below that reference Supabase
> (PostgreSQL, RLS, `@supabase/*`, Supabase Auth/Realtime/Storage) are
> **historical**. The production stack is Cloudflare Workers with D1 + Drizzle
> (relational), R2 (files), KV (cache), Queues (async) and Turnstile (abuse).
> See `docs/ARCHITECTURE.md`, `docs/CLOUDFLARE.md`, `docs/AUTH.md`,
> `docs/DATABASE.md`, `docs/DEPLOYMENT.md`, and `docs/REALTIME.md`.

# Souk El Gomla — Engineering Handbook

This document is the authoritative engineering reference for the Souk El Gomla project. All contributors must follow these standards to keep the codebase production-ready, scalable, and maintainable.
# Souk El Gomla — Engineering Handbook

This document is the authoritative engineering reference for the Souk El Gomla project. All contributors must follow these standards to keep the codebase production-ready, scalable, and maintainable.

---

## 1. Folder Structure

```
souk-el-gomla/
├── app/                          # Next.js App Router (route endpoints)
│   ├── admin/                    # Admin dashboard route group
│   │   ├── layout.tsx            # Admin shell layout
│   │   ├── page.tsx              # Dashboard home
│   │   ├── login/                # Auth page
│   │   ├── orders/               # Orders module routes
│   │   ├── products/             # Products module routes
│   │   └── ...                   # Other feature routes
│   └── layout.tsx                # Root layout
│
├── components/                   # Cross-cutting UI components
│   ├── ui/                       # shadcn/ui primitives
│   ├── shared/                   # App-shared components
│   ├── layout/                   # Shell components (sidebar, topbar, etc.)
│   └── auth/                     # Auth-related components
│
├── src/
│   ├── app/                      # (optional) App-level utilities
│   ├── components/               # Feature-scoped components (co-located)
│   ├── features/                 # Feature-based modules (domain logic)
│   │   ├── orders/
│   │   ├── products/
│   │   └── ...                   # One folder per feature
│   ├── hooks/                    # Shared custom hooks
│   ├── lib/                      # Utilities, constants, permissions
│   ├── services/                 # Data access layer (Supabase, APIs)
│   ├── providers/                # Context providers
│   ├── test/                     # Test setup + render helpers
│   └── types/                    # TypeScript types
│
├── supabase/
│   ├── migrations/               # SQL migrations (numbered 001, 002, ...)
│   └── functions/                # Supabase Edge Functions
│       ├── _shared/              # Shared helpers (cors, auth, response)
│       └── <function-name>/      # One folder per edge function
│
├── e2e/                          # Playwright end-to-end tests
├── public/                       # Static assets
├── docs/                         # Project documentation
├── vitest.config.ts              # Unit test config
├── playwright.config.ts          # E2E test config
└── package.json
```

**Rules:**
- Routes live in `app/`, feature logic in `src/features/`.
- UI primitives in `components/ui/`; layout components in `components/layout/`.
- Keep feature components co-located with their feature folder.
- No business logic in route files — routes only compose pages and components.

---

## 2. Naming Conventions

### Files & Folders
| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `ProductCard.tsx` |
| Hooks | `use` + PascalCase | `useDebounce.ts` |
| Utils/lib | camelCase | `format.ts`, `permissions.ts` |
| Services | camelCase | `supabase-client.ts` |
| Config files | camelCase | `routes.ts`, `query-keys.ts` |
| SQL migrations | zero-padded number + snake_case | `001_initial_schema.sql` |
| Edge functions | kebab-case | `process-order.ts` |

### Variables & Functions
| Scope | Convention | Example |
|-------|-----------|---------|
| Local variables | camelCase | `orderCount` |
| Constants | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Functions | camelCase (verb first) | `getOrderById()` |
| Types/interfaces | PascalCase | `OrderSummary` |
| Enums | PascalCase type + union values | `type OrderStatus = 'new' \| ...` |
| Database columns | snake_case | `order_number` |
| Database tables | plural snake_case | `purchase_orders` |

### Database
- Tables: plural snake_case — `orders`, `products`, `inventory_movements`.
- Columns: snake_case — `created_at`, `updated_at`, `deleted_at`.
- Enums: UPPER_SNAKE_CASE values — `'out_for_delivery'`.
- Indexes: `idx_<table>_<column>`.
- Policies: `"<Table>: <role> <action>"` — e.g., `"Orders: staff read"`.

---

## 3. Code Style

- **TypeScript strict** mode is mandatory. No `any` except in rare, documented cases.
- **2-space indentation**, no semicolons, single quotes.
- **Named exports** for components and utilities. No default exports except Next.js pages.
- **Imports order**: external packages → internal `@/` aliases → relative imports.
- Use `const` over `let` wherever possible. Avoid `var`.
- Destructure props with TypeScript interfaces.

```tsx
// ✅ Good
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import type { Order } from '@/types/entities'

interface Props {
  order: Order
  onUpdate: (id: string) => void
}

export function OrderCard({ order, onUpdate }: Props) {
  // ...
}

// ❌ Avoid
export default function (props: any) {
  // ...
}
```

- No magic strings — use constants or config files (`routes.ts`, `constants.ts`).
- Prefer early returns to avoid deep nesting.

---

## 4. Component Guidelines

### Structure
Each component should follow this pattern:

```tsx
'use client'  // Only if client-side

import { useState } from 'react'
// imports...

interface Props { ... }

export function ComponentName({ ... }: Props) {
  // state/hooks
  // derived values
  // handlers

  return ( <>...</> )
}
```

### Rules
- **Server components by default** — only add `'use client'` when necessary.
- One primary responsibility per component.
- No business logic inside components — delegate to services/hooks.
- Formatting/parsing lives in `src/lib/format.ts`, not inline.
- All user-facing text is Arabic unless explicitly technical.
- Components that fetch data must use TanStack Query hooks, not raw `useEffect`.
- Forms use React Hook Form + Zod validation (when introduced).
- Keep components small (< 200 lines). Extract sub-components when larger.

---

## 5. Service Layer Rules

Services are the **only** place that talks to Supabase (or external APIs).

### Location
- `src/services/` for shared services.
- Feature-specific services in `src/features/<feature>/services/`.

### Naming
- File: `<entity>.ts` — e.g., `orders.ts`, `products.ts`.
- Functions: `<verb><Entity>` — e.g., `getOrders()`, `createOrder()`, `updateOrderStatus()`.

### Pattern

```ts
// src/features/orders/services/orders.ts
'use server'  // Only if server-side (mutation)

import { supabase } from '@/services/supabase-client'
import type { OrderRow } from '@/types/database'

export async function getOrderById(id: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as OrderRow
}
```

### Rules
- Never expose raw Supabase clients/components — always wrap in services.
- Return typed domain entities, not raw DB rows (map when needed).
- Throw descriptive errors; never swallow errors silently.
- Batch queries with `.in()`, avoid N+1 patterns.
- Use RLS — never use the service-role client in client components.

---

## 6. Hook Rules

### Naming & Location
- Prefix every hook with `use` — `useAuth`, `useProductQuery`.
- Shared hooks in `src/hooks/`; feature hooks in `src/features/<feature>/hooks/`.

### Data Hooks
- Always use TanStack Query for server state.
- Query keys come from `src/config/query-keys.ts`.

```ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-keys'
import { getOrderById } from '@/services/orders'

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => getOrderById(id),
    enabled: !!id,
  })
}
```

### Rules
- Hooks must be composable and pure.
- Don't call hooks conditionally.
- Return stable references (`useCallback`, `useMemo`) for values in dependency arrays.
- Keep hook dependencies minimal.

---

## 7. Feature Module Rules

Each feature is self-contained in `src/features/<feature>/`:

```
src/features/orders/
├── components/        # Feature UI components
├── services/          # Data access
├── hooks/             # Query/mutation hooks
├── types/             # Feature-specific types
├── config/            # Feature constants
└── index.ts           # Public exports (barrel file)
```

### Rules
- **No cross-feature imports** — features communicate through shared services/types only.
- Feature is production-ready if: tested, typed, documented, and linted.
- Feature must be gated by feature flags if it's not yet launched.
- Keep feature exports explicit via `index.ts`.

---

## 8. Error Handling Strategy

### Client-Side
- Wrap mutations in try/catch and show `toast` notifications.
- Use React Query's `onError` for query failures.
- Global Error Boundary at app root (`app/error.tsx`).
- Route-level errors via `app/admin/error.tsx`.

```ts
import { toast } from 'sonner'  // or similar

try {
  await createOrder(input)
  toast.success('تم إنشاء الطلب بنجاح')
} catch (error) {
  toast.error(error instanceof Error ? error.message : 'حدث خطأ ما')
}
```

### Server-Side
- Services throw typed errors (`Error` subclasses when needed).
- Edge Functions return structured error responses (`{ error: { code, message } }`).
- Supabase errors are wrapped and re-thrown with context.

```ts
if (error) {
  throw new Error(`Failed to fetch order ${id}: ${error.message}`)
}
```

### Supabase / Database
- RLS policies enforce security — errors from RLS are treated as forbidden.
- Handle `unique_violation` (23505), `foreign_key_violation` (23503), `check_violation` (23514).
- Immutable tables (e.g., `inventory_movements`) should reject UPDATE/DELETE at DB level.

---

## 9. Logging Strategy

### Levels
| Level | Usage |
|-------|-------|
| `debug` | Development only, verbose |
| `info` | Key business events (order created, user login) |
| `warn` | Recoverable issues (low stock, failed payment retry) |
| `error` | Unhandled exceptions, failed operations |

### Rules
- Log **structured** data (JSON) — never free-form strings.
- Include: timestamp, correlation ID, user ID (when available), entity, entity ID.
- Don't log PII (phone numbers, addresses) in plaintext.
- Client-side logs go through a logging wrapper; server-side through `console`/logger.

### Activity Logs
- Use the `activity_logs` table for audit trail of business actions.
- Edge Functions that mutate data should write activity logs.

```ts
await supabase.from('activity_logs').insert({
  user_id: userId,
  action: 'order.status_changed',
  entity: 'order',
  entity_id: orderId,
  metadata: { from: 'new', to: 'accepted' },
})
```

---

## 10. Security Guidelines

### Authentication & Authorization
- **RLS** is the primary security boundary — frontend guards are UX only.
- Use `auth.uid()` in RLS policies; never trust client-supplied user ID.
- Service-role key is **server-only**; never shipped to the browser.
- Passwords are handled by Supabase Auth — never store raw credentials.

### Data Protection
- All environment variables go through `src/lib/env.ts` — no direct `process.env` access in components.
- Sanitize user input server-side (Zod validation in Edge Functions / Server Actions).
- Never log secrets, tokens, or full user PII.

### Edge Functions
- Verify JWT via `getAuthUser()` from `_shared/supabase-admin.ts`.
- Validate all input with `_shared/validation.ts`.
- Use CORS headers from `_shared/cors.ts`.
- Rate-limit public endpoints (Turnstile for public forms).

### Storage
- Buckets are public-read only for images.
- Uploads go through RLS-protected storage policies.
- Validate MIME types and file sizes in the client and server.

### Headers
- Set security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- Use Cloudflare for WAF, rate limiting, and bot management.

---

## 11. API Conventions

### REST (Edge Functions)
- Base URL: `/functions/v1/<function-name>`
- Methods: GET (read), POST (create/execute), PATCH (update), DELETE (remove).
- Success: `200/201` with `{ data: ... }`.
- Errors: `400` validation, `401` unauthorized, `403` forbidden, `404` not found, `500` server error.

```ts
// Success
{ "data": { "id": "uuid", "status": "created" } }

// Error
{ "error": { "code": "validation_error", "message": "Missing required field: name" } }
```

### Supabase PostgREST
- Use `.select()`, `.eq()`, `.order()`, `.range()` with explicit typing.
- Never use `select('*')` in client code — pick only needed columns.
- Use `.maybeSingle()` over `.single()` when rows may not exist.
- Pagination with `range(from, to)`.

---

## 12. Git Commit Conventions

### Commit Message Format
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types
| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, no code change |
| `refactor` | Code change without behavior change |
| `perf` | Performance improvement |
| `test` | Adding/fixing tests |
| `chore` | Build/deps/tooling |
| `db` | Database migration |

### Examples
```
feat(orders): add status advancement flow
fix(products): correct stock decrement on order create
db: add suppliers and purchase_orders tables
docs: update ENGINEERING.md with API conventions
test(auth): add login form validation tests
```

### Rules
- Subject in **imperative, lowercase** — "add", not "added".
- Keep subject ≤ 72 chars.
- Scope optional but recommended (`orders`, `products`, `auth`, `db`).
- Reference issues in footer: `Closes #123`.

---

## 13. Branch Naming Strategy

### Feature Branches
```
feature/<feature-name>
```
Examples: `feature/orders-kanban`, `feature/products-bulk-edit`

### Bugfix Branches
```
fix/<short-description>
```
Examples: `fix/order-total-calculation`, `fix/sidebar-rtl-overflow`

### Database Branches
```
db/<migration-description>
```
Examples: `db/add-inventory-movements`, `db/add-feature-flags`

### Chore/Infrastructure
```
chore/<description>
```
Examples: `chore/setup-vitest`, `chore/update-dependencies`

### Release Branches
```
release/<version>
```
Examples: `release/v1.0.0`, `release/v1.1.0`

### Rules
- All branches must be merged via Pull Request (no direct pushes to `main`).
- PR titles follow the commit convention: `feat(orders): ...`.
- Each PR must reference the milestone/task it belongs to.

---

## 14. Testing Strategy

### Unit Tests (Vitest)
- Cover: utilities, hooks, services, pure business logic.
- Location: co-located `*.test.ts(x)` with source files.
- Use `renderWithProviders` from `src/test/render.tsx` for component tests.

### E2E Tests (Playwright)
- Cover: critical user journeys (login, order flow, product management).
- Location: `e2e/` folder.
- Use `data-testid` attributes for stable selectors.

### Commands
```bash
pnpm test              # Run unit tests once
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
pnpm test:e2e          # Run Playwright e2e
pnpm test:e2e:ui       # Playwright UI mode
```

---

*This handbook is a living document. Update it when adding new patterns or conventions — never let it drift from the actual codebase.*
