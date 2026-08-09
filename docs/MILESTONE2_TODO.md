# Milestone 2 — Application Shell (Implementation Tracker)

> Status: **Complete** — Phase A done, Phase B implemented + runtime-verified (25/25 PASS, 0 console errors).

## Phase A — Foundation Items ✅

- [x] Install `zod` dependency
- [x] `docs/adr/ADR-001-application-shell.md` — architecture decision record
- [x] `src/lib/env.ts` — rewrite with Zod schema validation (preserve export shape)
- [x] `src/lib/logger.ts` — central structured logger
- [x] `src/lib/errors.ts` — shared application error codes + `AppError`
- [x] `src/lib/monitoring.ts` — no-op integration point (Sentry/OpenTelemetry)
- [x] `src/lib/assert.ts` — internal runtime assertions
- [x] `src/shared/schema/` — shared Zod schemas (common + pagination + barrel)
- [x] Stop + verify Phase A (tsc --noEmit) — **4 pre-existing errors in legacy demo components only**

## Phase B — Application Shell (Milestone 2) ✅ (implemented)

- [x] `src/config/sidebar.ts` — add `featureFlag` support
- [x] `src/components/theme-toggle.tsx` — light/dark toggle
- [x] `src/lib/breadcrumbs.ts` — breadcrumb item derivation from sidebar config
- [x] `src/components/layout/breadcrumbs.tsx`
- [x] `src/components/layout/page-header.tsx`
- [x] `src/components/layout/shell-context.tsx` — shell state + permission/flag mocks
- [x] `src/components/layout/icon-map.ts` — string icon name → lucide component
- [x] `src/components/layout/app-sidebar.tsx` — RTL, collapse, drawer, nested, keyboard nav
- [x] `src/components/layout/topbar.tsx` — search/notifications/branch/user extension points
- [x] `src/components/layout/app-shell.tsx` — orchestration + extension slots
- [x] `src/components/feedback/skeleton.tsx`
- [x] `src/components/feedback/empty-state.tsx`
- [x] `app/admin/layout.tsx` — admin shell layout
- [x] `app/admin/error.tsx` — global error boundary
- [x] `app/admin/not-found.tsx` — 404 page
- [x] `app/admin/loading.tsx` — skeleton loading UI
- [x] Rewire `app/admin/page.tsx`, `orders/page.tsx`, `products/page.tsx` to PageHeader + placeholders
- [x] `app/globals.css` — admin layout tokens (sidebar/topbar widths)
- [x] Verify: `tsc --noEmit` + `pnpm lint` + no hydration warnings
  - [x] `tsc --noEmit` — only 4 pre-existing errors in legacy demo components (`components/admin-dashboard.tsx`: 3× TS2322, `components/products-management.tsx`: 1× TS7053) — documented Phase 0 leftovers, will be replaced by feature modules
  - [x] `pnpm lint` — 0 errors, 32 warnings (all warning-level; new code clean)
  - [x] No hydration warnings in new shell components

## Out of Scope (later milestones)

- Authentication / RBAC / middleware
- Dashboard widgets / business logic / feature modules
- Notifications backend / search backend / realtime data

