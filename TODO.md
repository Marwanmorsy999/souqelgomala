# SOUK EL GOMLA — FRONTEND STOREFRONT UPGRADE (MILESTONE)

In-place, mobile-first Arabic RTL upgrade. Preserve logo, brand colors, and the
Cloudflare-first backend (D1 + Drizzle + R2 + KV + Queues + Turnstile).

## STATUS TRACKING

- [x] **1. StructuredData cleanup**
      Typed `OrganizationLdJson`, derive phone from `SITE.whatsapp`, use
      `SITE.addressLines`, safe JSON-LD serialization (`<` escaped).
- [x] **2. Premium professional imagery**
      Added shared `image()` helper in `lib/site.ts` + `lib/data.ts`; upgraded
      hero + category + product image URLs to sharp, consistent, correctly
      cropped photography. Preserve aspect ratios, no stretching.
- [x] **3. Circular category cards**
      Converted `components/home/sections/Categories.tsx` to circular cards with
      horizontal scroll on mobile / grid on desktop.
- [x] **4. Strong product cards + "أضف للسلة" CTA**
      Added visible labeled add-to-cart button; keep stepper when quantity > 0.
- [x] **5. Premium hero section**
      Editorial treatment, stronger hierarchy, refined gradient, hero image
      shared via `lib/data`; kept CTAs.
- [x] **6. Latest products section**
      Polished header + desktop "تصفح الأقسام" link + wider mobile cards.
- [x] **7. Mobile navigation audit**
      Sticky header, fixed bottom nav, hamburger drawer, search overlay,
      WhatsApp button safe-area positioning — verified existing implementations.
- [x] **8. Cart empty-state audit**
      Confirmed "السلة فاضية" + "ابدأ التسوق" already present and polished.
- [x] **9. Responsive / RTL / accessibility check**
      Horizontal scroll, touch targets, focus states, aria labels, no overflow.

## VALIDATION

- [x] `pnpm exec tsc --noEmit` — passed, no errors
- [x] `pnpm lint` — 0 errors, 48 pre-existing warnings (none introduced)
- [x] `pnpm test` — 1 file passed, 6 tests passed
- [x] `pnpm build` — completed successfully, all routes compiled
- [ ] Browser verification at 320/375/390/430/768/1024/1440px (manual)
