# Milestone 4 — Production Catalog + Cloudinary Media

Replace demo/static storefront catalog with D1/Drizzle-backed production catalog
and Cloudinary-powered public media.

## Architecture
- D1 → source of truth (relational catalog)
- Drizzle ORM → D1 access
- Cloudinary → public storefront media (transformations/CDN)
- Cloudflare KV → cache layer (never primary)
- R2 → private/general object storage only (NOT public storefront images)
- Server-side RBAC + Zod validation
- Cloudflare Workers/Next.js → application/API layer

## Domain mapping (old → new)
```
D1 Product (products + product_media + category_media)
   ↓
Catalog mapper (src/services/catalog/mapper.ts)
   ↓
Storefront Product (lib/types.ts)
   ↓
Existing UI (ProductCard, ProductDetail, Categories, etc.)
```

Pricing model:
- `price` → retail
- `wholesale_price` → wholesale
- `offer_price` → current promotional price
- `compare_at_price` → original/comparison price

## Tasks
- [x] Inspect existing schema, catalog service, storefront, storage, KV, bindings
- [x] D1 schema: product_media, category_media, wholesale_price, compare_at_price
- [x] DB types: ProductMediaRow, ProductRow pricing, ProductWithRelations
- [x] entities.ts: ProductFormValues media model + pricing fields
- [ ] Cloudinary service (types, client, upload, urls, index, image helper)
- [ ] Catalog repository + service (D1+Drizzle, pagination, active-only)
- [ ] Catalog mapper (D1 row → storefront Product)
- [ ] KV caching wired to catalog service + invalidation
- [ ] Public catalog API (products, categories, by-slug, search)
- [ ] Admin product/media API + service (server-side RBAC + Zod)
- [ ] Zod media schemas
- [ ] Migration finalize (only for un-captured changes)
- [ ] Storefront rewire (preserve design/RTL/component signatures)
- [ ] ProductJsonLd SEO (keep Organization JSON-LD)
- [ ] Tests (URL gen, transforms, validation, RBAC, invalidation, mapper)
- [ ] Verify: tsc --noEmit, lint, test, build

