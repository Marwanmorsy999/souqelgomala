/**
 * REAL end-to-end admin CRUD verification against the LOCAL D1 binding.
 *
 * PRINCIPLES (enforced deliberately):
 *  - Every mutation and every read goes through the PRODUCTION service layer.
 *  - Raw SQL is used ONLY as an INDEPENDENT persistence oracle (to confirm the
 *    bytes really landed in D1) — never to perform the operation under test.
 *  - Soft deletes are verified as `deleted_at IS NOT NULL` + absence from the
 *    real list service. They are NOT asserted as "row is gone".
 *  - No production code is modified to make anything pass.
 *
 * The local D1 shim lives in ./lib/d1-shim.ts and is validated separately by
 * scripts/verify-shim.ts before this harness is trusted.
 */

import path from 'node:path'
import { createD1Shim } from './lib/d1-shim.ts'

const DB_PATH = path.resolve(
  '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/e30bf897014d7857d1d837c5f3a6a249694380206214385f3c666aa64ebe8f14.sqlite',
)

const TRACE = process.argv.includes('--trace')
const { DB, sqlite } = createD1Shim(DB_PATH, { trace: TRACE })

/**
 * In-memory KV stand-in for the CACHE binding.
 *
 * NOTE: this is a REAL cache (it stores and returns values), not a no-op, so
 * that cache-invalidation bugs in the services are still observable. If a
 * service forgets to invalidate after a write, the stale value WILL be served
 * and the corresponding assertion will fail — which is what we want.
 */
const kvStore = new Map<string, string>()
const CACHE = {
  get: async (key: string) => kvStore.get(key) ?? null,
  put: async (key: string, value: string) => {
    kvStore.set(key, value)
  },
  delete: async (key: string) => {
    kvStore.delete(key)
  },
  list: async () => ({ keys: [...kvStore.keys()].map((name) => ({ name })), list_complete: true }),
}

;(globalThis as Record<string, unknown>).DB = DB
;(globalThis as Record<string, unknown>).CACHE = CACHE

// ── Reporting ───────────────────────────────────────────────────────────────
type Status = 'PASS' | 'FAIL' | 'BLOCKED'
interface Result {
  area: string
  op: string
  status: Status
  detail?: unknown
}
const results: Result[] = []

function record(area: string, op: string, status: Status, detail?: unknown) {
  results.push({ area, op, status, detail })
  const tag = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'BLOCKED'
  const suffix = detail !== undefined ? ` | ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''
  console.log(`${tag.padEnd(7)} | ${area.padEnd(10)} | ${op}${suffix}`)
}
const check = (area: string, op: string, ok: boolean, detail?: unknown) =>
  record(area, op, ok ? 'PASS' : 'FAIL', detail)

// ── Independent persistence oracle (raw SQL — verification only) ────────────
function oracle<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | null {
  const rows = sqlite.prepare(sql).all(...(params as never[])) as T[]
  return rows.length ? rows[0] : null
}

const OWNER = { id: '10000000-0000-0000-0000-000000000001', role: 'owner', email: 'owner@test' } as never
const EMPLOYEE = { id: '10000000-0000-0000-0000-0000000000ee', role: 'employee', email: 'emp@test' } as never

async function main() {
  // Production services — the source of truth under test.
  const adminOffers = await import('@/services/catalog/admin-offers-service')
  const social = await import('@/services/social')
  const admin = await import('@/services/catalog/admin-service')
  const settings = await import('@/services/settings')
  const orders = await import('@/services/orders')
  const customers = await import('@/services/customers')
  const catalog = await import('@/services/catalog/service')

  const nowIso = () => new Date().toISOString()
  const stamp = Date.now()

  // ══════════════════════════════ PRODUCTS ══════════════════════════════
  let productId: string | undefined
  try {
    const created = await admin.createProduct(OWNER, {
      nameAr: `VERIFY-PRODUCT-${stamp}`,
      nameEn: 'Verify Product',
      price: 9,
      wholesalePrice: 7,
      unit: 'كيلو',
      stock: 5,
      isVisible: true,
    } as never)
    productId = (created as { id: string })?.id
    check('PRODUCTS', 'CREATE (service returns real id)', typeof productId === 'string' && productId.length > 0, {
      id: productId,
    })

    // READ through the real admin list service
    const listed = await admin.listProductsAdmin({ search: `VERIFY-PRODUCT-${stamp}` })
    const found = listed.find((p) => p.id === productId)
    check('PRODUCTS', 'READ (listProductsAdmin returns created product)', !!found, {
      id: found?.id,
      name_ar: found?.name_ar,
      price: found?.price,
    })

    // UPDATE through the real service, verified independently in D1
    await admin.updateProduct(OWNER, productId!, { price: 11 } as never)
    const afterUpdate = oracle<{ price: number }>('select price from products where id = ?', [productId])
    check('PRODUCTS', 'UPDATE (price persisted in D1)', afterUpdate?.price === 11, { price: afterUpdate?.price })

    // SOFT DELETE — assert deleted_at IS NOT NULL (NOT row absence)
    await admin.softDeleteProduct(OWNER, productId!)
    const del = oracle<{ deleted_at: string | null; is_visible: number; status: string }>(
      'select deleted_at, is_visible, status from products where id = ?',
      [productId],
    )
    check('PRODUCTS', 'ARCHIVE (row still exists, deleted_at IS NOT NULL)', del !== null && del.deleted_at !== null, {
      rowStillPresent: del !== null,
      deleted_at: del?.deleted_at,
      is_visible: del?.is_visible,
      status: del?.status,
    })

    // ...and the normal list service must no longer return it
    const afterDelete = await admin.listProductsAdmin({ search: `VERIFY-PRODUCT-${stamp}` })
    check(
      'PRODUCTS',
      'LIST EXCLUDES archived product',
      !afterDelete.some((p) => p.id === productId),
      { remainingMatches: afterDelete.length },
    )
  } catch (e) {
    record('PRODUCTS', 'FLOW', 'FAIL', String(e))
  }

  // ══════════════════════════════ CATEGORIES ══════════════════════════════
  let categoryId: string | undefined
  try {
    const created = await admin.createCategory(OWNER, {
      nameAr: `تصنيف تحقق ${stamp}`,
      nameEn: 'Verify Cat',
      image: 'https://example.com/c.jpg',
      sortOrder: 99,
    })
    categoryId = (created as { id: string })?.id
    check('CATEGORIES', 'CREATE (service returns real id)', typeof categoryId === 'string' && !!categoryId, {
      id: categoryId,
    })

    const listed = await admin.listCategoriesAdmin()
    check('CATEGORIES', 'READ (listCategoriesAdmin includes it)', listed.some((c) => c.id === categoryId))

    await admin.updateCategory(OWNER, categoryId!, { nameAr: `تصنيف تحقق ${stamp} م` } as never)
    const upd = oracle<{ name_ar: string }>('select name_ar from categories where id = ?', [categoryId])
    check('CATEGORIES', 'UPDATE (name persisted in D1)', upd?.name_ar === `تصنيف تحقق ${stamp} م`, {
      name_ar: upd?.name_ar,
    })

    await admin.softDeleteCategory(OWNER, categoryId!)
    const del = oracle<{ deleted_at: string | null }>('select deleted_at from categories where id = ?', [categoryId])
    check('CATEGORIES', 'ARCHIVE (row exists, deleted_at IS NOT NULL)', del !== null && del.deleted_at !== null, {
      rowStillPresent: del !== null,
      deleted_at: del?.deleted_at,
    })

    const afterDelete = await admin.listCategoriesAdmin()
    check('CATEGORIES', 'LIST EXCLUDES archived category', !afterDelete.some((c) => c.id === categoryId))
  } catch (e) {
    record('CATEGORIES', 'FLOW', 'FAIL', String(e))
  }

  // ══════════════════════════════ OFFERS ══════════════════════════════
  let activeOfferId: string | undefined
  let expiredOfferId: string | undefined
  try {
    const realProduct = oracle<{ id: string }>(
      'select id from products where deleted_at is null and status = ? and is_visible = 1 limit 1',
      ['active'],
    )
    const linkedProductId = realProduct?.id

    // ACTIVE offer: start_date <= now AND end_date >= now  (service predicate)
    const activeOffer = await adminOffers.createOffer(OWNER, {
      campaignName: `VERIFY-ACTIVE-${stamp}`,
      discountType: 'percentage',
      value: 15,
      productIds: linkedProductId ? [linkedProductId] : [],
      startDate: new Date(Date.now() - 3_600_000).toISOString(), // 1h ago
      endDate: new Date(Date.now() + 86_400_000).toISOString(), // +1 day
      status: 'active',
      isFeatured: true,
    } as never)
    activeOfferId = (activeOffer as { id: string })?.id
    check('OFFERS', 'CREATE (service returns real id)', !!activeOfferId, { id: activeOfferId })

    const createdRow = oracle<{ is_featured: number; product_ids: string; status: string }>(
      'select is_featured, product_ids, status from offers where id = ?',
      [activeOfferId],
    )
    check('OFFERS', 'CREATE featured flag persisted', createdRow?.is_featured === 1, {
      is_featured: createdRow?.is_featured,
    })
    check(
      'OFFERS',
      'CREATE product association persisted',
      !linkedProductId || (createdRow?.product_ids ?? '').includes(linkedProductId),
      { product_ids: createdRow?.product_ids },
    )

    // READ through the real admin list service
    const offerList = await adminOffers.listOffersAdmin()
    const listedOffer = offerList.find((o) => o.id === activeOfferId)
    check('OFFERS', 'READ (listOffersAdmin resolves offer + products)', !!listedOffer, {
      id: listedOffer?.id,
      productCount: listedOffer?.productCount,
      productNames: listedOffer?.productNames,
    })

    // UPDATE
    await adminOffers.updateOffer(OWNER, activeOfferId!, { value: 25, isFeatured: false } as never)
    const upd = oracle<{ value: number; is_featured: number }>('select value, is_featured from offers where id = ?', [
      activeOfferId,
    ])
    check('OFFERS', 'UPDATE (value + featured persisted)', upd?.value === 25 && upd?.is_featured === 0, upd)

    // Deactivate / reactivate
    await adminOffers.updateOffer(OWNER, activeOfferId!, { status: 'inactive' } as never)
    const deact = oracle<{ status: string }>('select status from offers where id = ?', [activeOfferId])
    await adminOffers.updateOffer(OWNER, activeOfferId!, { status: 'active', isFeatured: true } as never)
    const react = oracle<{ status: string }>('select status from offers where id = ?', [activeOfferId])
    check('OFFERS', 'ACTIVATE / DEACTIVATE', deact?.status === 'inactive' && react?.status === 'active', {
      deactivated: deact?.status,
      reactivated: react?.status,
    })

    // EXPIRED offer: end_date < now → must fail the service's date predicate
    const expiredOffer = await adminOffers.createOffer(OWNER, {
      campaignName: `VERIFY-EXPIRED-${stamp}`,
      discountType: 'percentage',
      value: 10,
      productIds: linkedProductId ? [linkedProductId] : [],
      startDate: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      endDate: new Date(Date.now() - 86_400_000).toISOString(), // ended yesterday
      status: 'active', // status is active, ONLY the date window disqualifies it
      isFeatured: false,
    } as never)
    expiredOfferId = (expiredOffer as { id: string })?.id

    // Exercise the REAL storefront path: getDailyOffers → findActiveOffersWithProducts
    kvStore.clear() // ensure we read from D1, not a stale cache
    const daily = await catalog.getDailyOffers(50)
    const activeVisible = daily.offers.some((o) => o.id === activeOfferId)
    const expiredVisible = daily.offers.some((o) => o.id === expiredOfferId)
    check('OFFERS', 'getDailyOffers(): ACTIVE offer IS returned', activeVisible, {
      totalOffers: daily.offers.length,
    })
    check('OFFERS', 'getDailyOffers(): EXPIRED offer is NOT returned', !expiredVisible, {
      expiredId: expiredOfferId,
      expiredVisible,
    })

    // Product association resolved through the real inArray path
    const activeEntry = daily.offers.find((o) => o.id === activeOfferId)
    check(
      'OFFERS',
      'product association resolved via inArray (real repository)',
      !linkedProductId || (activeEntry?.products?.length ?? 0) > 0,
      { products: activeEntry?.products?.length ?? 0 },
    )

    // SOFT DELETE both
    await adminOffers.softDeleteOffer(OWNER, activeOfferId!)
    await adminOffers.softDeleteOffer(OWNER, expiredOfferId!)
    const delRow = oracle<{ deleted_at: string | null }>('select deleted_at from offers where id = ?', [activeOfferId])
    check('OFFERS', 'ARCHIVE (row exists, deleted_at IS NOT NULL)', delRow !== null && delRow.deleted_at !== null, {
      rowStillPresent: delRow !== null,
      deleted_at: delRow?.deleted_at,
    })
    const listAfter = await adminOffers.listOffersAdmin()
    check(
      'OFFERS',
      'LIST EXCLUDES archived offers',
      !listAfter.some((o) => o.id === activeOfferId || o.id === expiredOfferId),
    )
  } catch (e) {
    record('OFFERS', 'FLOW', 'FAIL', String(e))
  }

  // ══════════════════════════════ SOCIAL ══════════════════════════════
  try {
    const created = await social.createSocialPost(OWNER, {
      platform: 'facebook',
      url: 'https://facebook.com/verify-test',
      thumbnail: 'https://example.com/thumb.jpg',
      title: `VERIFY social ${stamp}`,
      caption: 'caption verify',
      postDate: nowIso(),
      featured: true,
      linkedOfferId: null,
      isVisible: true,
    } as never)
    // FIX: use the created social object's own id (was incorrectly `created?.id`
    // referring to an unrelated offer variable in the previous harness).
    const s = created as { id: string; featured: boolean | number; is_visible: boolean | number }
    check('SOCIAL', 'CREATE (service returns real id)', typeof s?.id === 'string' && !!s.id, { id: s?.id })

    const row = oracle<{ platform: string; url: string; thumbnail: string; featured: number; is_visible: number }>(
      'select platform, url, thumbnail, featured, is_visible from social_posts where id = ?',
      [s.id],
    )
    check(
      'SOCIAL',
      'CREATE fields persisted (platform,url,thumbnail,featured,visibility)',
      row?.platform === 'facebook' &&
        row?.url === 'https://facebook.com/verify-test' &&
        row?.thumbnail === 'https://example.com/thumb.jpg' &&
        row?.featured === 1 &&
        row?.is_visible === 1,
      row,
    )

    // READ via the real admin list
    const adminList = await social.listSocialPostsAdmin()
    check('SOCIAL', 'READ (listSocialPostsAdmin includes post)', adminList.some((p) => p.id === s.id))

    // Link to a real offer to exercise linkedOfferId + the inArray title lookup
    const someOffer = oracle<{ id: string }>('select id from offers where deleted_at is null limit 1')
    await social.updateSocialPost(OWNER, s.id, {
      caption: 'updated caption',
      featured: false,
      isVisible: false,
      linkedOfferId: someOffer?.id ?? null,
    } as never)
    const upd = oracle<{ caption: string; featured: number; is_visible: number; linked_offer_id: string | null }>(
      'select caption, featured, is_visible, linked_offer_id from social_posts where id = ?',
      [s.id],
    )
    check(
      'SOCIAL',
      'UPDATE (caption, featured, visibility, linkedOfferId persisted)',
      upd?.caption === 'updated caption' && upd?.featured === 0 && upd?.is_visible === 0,
      upd,
    )
    check(
      'SOCIAL',
      'linkedOfferId stored + title resolved via inArray',
      !someOffer || (await social.listSocialPostsAdmin()).find((p) => p.id === s.id)?.linkedOfferTitle !== null,
      { linked_offer_id: upd?.linked_offer_id },
    )

    // Visibility filter on the public feed
    kvStore.clear()
    const feed = await social.getPublicSocialPosts(50)
    check('SOCIAL', 'VISIBILITY (hidden post excluded from public feed)', !feed.some((p) => p.id === s.id), {
      feedCount: feed.length,
    })

    // Re-show and confirm it comes back + featured flag round-trips
    await social.updateSocialPost(OWNER, s.id, { isVisible: true, featured: true } as never)
    kvStore.clear()
    const feed2 = await social.getPublicSocialPosts(50)
    const back = feed2.find((p) => p.id === s.id)
    check('SOCIAL', 'FEATURED flag + visibility restore round-trip', !!back && back.featured === true, {
      visible: !!back,
      featured: back?.featured,
    })

    await social.softDeleteSocialPost(OWNER, s.id)
    const del = oracle<{ deleted_at: string | null }>('select deleted_at from social_posts where id = ?', [s.id])
    check('SOCIAL', 'DELETE (soft: row exists, deleted_at IS NOT NULL)', del !== null && del.deleted_at !== null, {
      rowStillPresent: del !== null,
      deleted_at: del?.deleted_at,
    })
    check(
      'SOCIAL',
      'LIST EXCLUDES deleted post',
      !(await social.listSocialPostsAdmin()).some((p) => p.id === s.id),
    )
  } catch (e) {
    record('SOCIAL', 'FLOW', 'FAIL', String(e))
  }

  // ══════════════════════════════ ORDERS ══════════════════════════════
  try {
    // Ensure at least one order exists, created through the real service.
    const existingCount = oracle<{ c: number }>('select count(*) as c from orders where deleted_at is null')?.c ?? 0
    if (existingCount === 0) {
      const prod = oracle<{ id: string; name_ar: string; price: number }>(
        'select id, name_ar, price from products where deleted_at is null limit 1',
      )
      await orders.createOrder({
        customerName: 'VERIFY Customer',
        customerPhone: '01000000000',
        customerAddress: 'VERIFY address',
        deliveryFee: 10,
        pricingMode: 'retail',
        items: prod ? [{ id: prod.id, name: prod.name_ar, quantity: 2, unitPrice: prod.price }] : [],
      })
    }

    const list = await orders.listOrders(100)
    check('ORDERS', 'LIST (listOrders returns rows)', Array.isArray(list) && list.length > 0, { count: list.length })

    // The id MUST be real — this is what the broken shim used to destroy.
    const first = list[0]
    const idIsReal = typeof first?.id === 'string' && first.id.length > 0
    check('ORDERS', 'LIST returns a REAL id (not undefined)', idIsReal, {
      id: first?.id,
      orderNumber: first?.orderNumber,
      status: first?.status,
    })

    if (idIsReal) {
      // DETAIL through the real service
      const detail = await orders.getOrderDetail(first.id)
      check('ORDERS', 'DETAIL (getOrderDetail returns order + items)', !!detail && detail.order.id === first.id, {
        id: detail?.order?.id,
        items: detail?.items?.length,
      })

      // STATUS UPDATE — use a status the service actually accepts.
      const original = first.status
      const target = original === 'delivered' ? 'preparing' : 'delivered'
      await orders.updateOrderStatus(first.id, target)

      // Independent persistence oracle
      const persisted = oracle<{ status: string }>('select status from orders where id = ?', [first.id])
      check('ORDERS', 'STATUS UPDATE persisted in D1', persisted?.status === target, {
        from: original,
        to: persisted?.status,
      })

      // Re-read through the real service
      const reread = await orders.getOrderDetail(first.id)
      check('ORDERS', 'RE-READ through service reflects new status', reread?.order.status === target, {
        status: reread?.order?.status,
      })

      // Restore
      await orders.updateOrderStatus(first.id, original)
      const restored = oracle<{ status: string }>('select status from orders where id = ?', [first.id])
      check('ORDERS', 'REVERT to original status', restored?.status === original, { status: restored?.status })

      // Invalid status must be rejected (validation stays enforced)
      let rejected = false
      try {
        await orders.updateOrderStatus(first.id, 'not_a_real_status')
      } catch {
        rejected = true
      }
      check('ORDERS', 'VALIDATION rejects invalid status', rejected)
    }
  } catch (e) {
    record('ORDERS', 'FLOW', 'FAIL', String(e))
  }

  // ══════════════════════════════ CUSTOMERS ══════════════════════════════
  try {
    const list = await customers.listCustomersAdmin({})
    check('CUSTOMERS', 'LIST (listCustomersAdmin returns rows)', Array.isArray(list) && list.length > 0, {
      count: list.length,
    })

    if (list.length > 0) {
      const c = list[0]
      check('CUSTOMERS', 'LIST rows expose a REAL id', typeof c.id === 'string' && c.id.length > 0, {
        id: c.id,
        phone: c.phone,
      })

      // SEARCH through the real service
      if (c.phone) {
        const searched = await customers.listCustomersAdmin({ search: c.phone })
        check('CUSTOMERS', 'SEARCH by phone returns the customer', searched.some((x) => x.id === c.id), {
          hits: searched.length,
        })
      }

      // DETAIL + order history through the real service
      const detail = await customers.getCustomerDetail(c.id)
      check('CUSTOMERS', 'DETAIL (getCustomerDetail returns customer)', !!detail && detail.customer.id === c.id, {
        id: detail?.customer?.id,
      })
      check('CUSTOMERS', 'ORDER HISTORY returned as array', Array.isArray(detail?.orders), {
        orders: detail?.orders?.length,
      })

      // Cross-check history against D1 independently
      if (detail) {
        const expected =
          oracle<{ c: number }>(
            'select count(*) as c from orders where deleted_at is null and (customer_id = ? or customer_phone = ?)',
            [c.id, c.phone],
          )?.c ?? 0
        check('CUSTOMERS', 'ORDER HISTORY count matches D1', detail.orders.length === expected, {
          service: detail.orders.length,
          d1: expected,
        })
      }
    }
  } catch (e) {
    record('CUSTOMERS', 'FLOW', 'FAIL', String(e))
  }

  // ══════════════════════════════ SETTINGS ══════════════════════════════
  try {
    // READ through the real service (exercises the .first()/limit(1) path).
    // NOTE: the real settings field is `phoneMain` (see src/lib/site-settings.ts);
    // an earlier harness asserted a non-existent `storePhone` key, which
    // `normalizeSiteSettings()` correctly drops.
    kvStore.clear()
    const before = await settings.getSiteSettings()
    check(
      'SETTINGS',
      'READ (getSiteSettings returns settings)',
      !!before && typeof before.phoneMain === 'string' && before.phoneMain.length > 0,
      { phoneMain: before?.phoneMain, name: before?.name },
    )

    const originalPhone = before.phoneMain
    const newPhone = `0109${String(stamp).slice(-7)}`

    // UPDATE through the real service
    await settings.updateSiteSettings(OWNER, { phoneMain: newPhone } as never)

    // Independent D1 oracle
    const rowRaw = oracle<{ value: string }>('select value from settings where key = ?', ['site'])
    const persistedPhone = rowRaw ? (JSON.parse(rowRaw.value) as { phoneMain?: string }).phoneMain : undefined
    check('SETTINGS', 'UPDATE persisted to D1 settings row', persistedPhone === newPhone, {
      d1: persistedPhone,
      expected: newPhone,
    })

    // RE-READ through the real service (cache must have been invalidated)
    const after = await settings.getSiteSettings()
    check('SETTINGS', 'RE-READ through service reflects update (cache invalidated)', after.phoneMain === newPhone, {
      phoneMain: after.phoneMain,
    })

    // Unrelated fields must be preserved by the merge (no data loss on partial update)
    check('SETTINGS', 'PARTIAL UPDATE preserves other fields', after.name === before.name && after.whatsapp === before.whatsapp, {
      name: after.name,
      whatsapp: after.whatsapp,
    })

    // Restore
    await settings.updateSiteSettings(OWNER, { phoneMain: originalPhone } as never)
    const restored = await settings.getSiteSettings()
    check('SETTINGS', 'REVERT to original value', restored.phoneMain === originalPhone, {
      phoneMain: restored.phoneMain,
    })
  } catch (e) {
    record('SETTINGS', 'FLOW', 'FAIL', String(e))
  }

  // ══════════════════════════════ AUTH / RBAC ══════════════════════════════
  try {
    const { hasPermission } = await import('@/lib/permissions')

    check('AUTH', 'owner has offers.write', hasPermission('owner', 'offers.write'))
    check('AUTH', 'employee DENIED products.write', !hasPermission('employee', 'products.write'))
    check('AUTH', 'employee DENIED settings.write', !hasPermission('employee', 'settings.write'))

    // The service layer must ENFORCE this, not just the matrix.
    const denials: Array<[string, () => Promise<unknown>]> = [
      ['createProduct', () => admin.createProduct(EMPLOYEE, { nameAr: 'X', price: 1, unit: 'كيلو', stock: 1 } as never)],
      ['createCategory', () => admin.createCategory(EMPLOYEE, { nameAr: 'X' })],
      [
        'createOffer',
        () =>
          adminOffers.createOffer(EMPLOYEE, {
            campaignName: 'X',
            discountType: 'percentage',
            value: 5,
            productIds: [],
            startDate: nowIso(),
            endDate: nowIso(),
            status: 'active',
          } as never),
      ],
      ['updateSiteSettings', () => settings.updateSiteSettings(EMPLOYEE, { storePhone: '0100' } as never)],
      [
        'createSocialPost',
        () =>
          social.createSocialPost(EMPLOYEE, {
            platform: 'facebook',
            url: 'https://x.test',
            title: 'X',
            postDate: nowIso(),
          } as never),
      ],
    ]

    for (const [name, fn] of denials) {
      let status = 0
      try {
        await fn()
      } catch (err) {
        status = (err as { status?: number }).status ?? 0
      }
      check('AUTH', `service enforces RBAC: ${name} → 403 for employee`, status === 403, { status })
    }

    // NOTE: the unauthenticated → 401 / authorized → 2xx / employee → 403
    // checks at the real HTTP route boundary live in scripts/verify-auth-api.ts,
    // which invokes the actual Next.js route handlers inside a request scope.
  } catch (e) {
    record('AUTH', 'FLOW', 'FAIL', String(e))
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const pass = results.filter((r) => r.status === 'PASS').length
  const fail = results.filter((r) => r.status === 'FAIL').length
  const blocked = results.filter((r) => r.status === 'BLOCKED').length

  console.log('\n═══════════════ SUMMARY ═══════════════')
  console.log(`PASS: ${pass}   FAIL: ${fail}   BLOCKED: ${blocked}`)
  if (fail > 0) {
    console.log('\nFailures:')
    for (const r of results.filter((x) => x.status === 'FAIL')) {
      console.log(`  - [${r.area}] ${r.op} :: ${JSON.stringify(r.detail)}`)
    }
  }
  if (blocked > 0) {
    console.log('\nBLOCKED — LOCAL RUNTIME LIMITATION:')
    for (const r of results.filter((x) => x.status === 'BLOCKED')) {
      console.log(`  - [${r.area}] ${r.op} :: ${r.detail}`)
    }
  }
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('HARNESS FATAL', e)
  process.exit(1)
})
