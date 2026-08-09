# Milestone 4 — Production Catalog + Cloudinary Media (Execution Tracker)

Decision: Option A — fully rewire storefront to D1-backed catalog API. No production
fallback to demo `lib/data.ts`. Cloudinary is the primary public media platform.

## Phases
- [x] Inspect existing implementation (schema, catalog service, storefront, storage, KV, bindings)
- [x] Fix blocker 1: duplicate `drizzle-orm` (pnpm override + dedupe in pnpm-workspace.yaml)
- [ ] Fix blocker 2: `repository.ts` uses `eq(col, null)` → `isNull()`
- [ ] Fix blocker 3: `database.generated.ts` still exports `productImages` → `productMedia`
- [ ] B. Catalog service + KV caching (`src/services/catalog/service.ts`)
- [ ] C. Public catalog API (`app/api/catalog/*`)
- [ ] D. Zod media schemas + admin product/media API (RBAC + Cloudinary flow)
- [ ] E. Storefront rewire (Catalog adapter, Categories, ProductCard, ProductDetail, LatestProducts, CategoryProducts, SearchOverlay, Hero) — preserve design/RTL
- [ ] F. Product JSON-LD SEO (keep Organization JSON-LD)
- [ ] G. Migration finalize + tests
- [ ] H. Verify: tsc --noEmit, lint, test, build
