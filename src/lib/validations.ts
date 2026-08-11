/**
 * Zod Validation Schemas
 *
 * Centralized, reusable validation for all domain entities.
 * Used by API routes and server actions to validate input before
 * writing to D1.
 */

import { z } from 'zod'

export const uuidSchema = z.string().uuid('Invalid ID format')
export const emailSchema = z.string().email('Invalid email address')
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional()
export const urlSchema = z.string().url('Invalid URL').optional()
export const positiveNumberSchema = z.number().positive('Must be a positive number')
export const nonnegativeNumberSchema = z.number().nonnegative('Must be a non-negative number')

/**
 * Catalog FK identifiers — used for `categories.parent_id` and
 * `products.category_id` (and their admin write schemas).
 *
 * New rows use standard RFC 4122 UUIDs, but the legacy/seeded catalog uses the
 * shape `10000000-0000-0000-0000-0000000000XX`. Zod's `z.string().uuid()`
 * enforces the RFC 4122 version/variant nibbles, which rejects those valid
 * seeded ids and blocks assigning products/parents to existing categories.
 *
 * Both forms are 8-4-4-4-12 hex tokens, so validate that shape (rejecting
 * arbitrary garbage) without the extra RFC nibble constraint. The `products`
 * / `categories` columns are text FKs with no DB-level UUID constraint.
 */
const catalogIdSchema = z.string().regex(/^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/, 'Invalid ID format')


export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  turnstile_token: z.string().optional(),
  csrf_token: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>

export const createBranchSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().optional(),
  code: z.string().optional(),
  address: z.string().optional(),
  phone: phoneSchema,
  workingHours: z.record(z.string(), z.object({ open: z.string(), close: z.string() })).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  googleMapsUrl: urlSchema,
  managerId: uuidSchema.optional(),
  isActive: z.boolean().default(true),
})

export type CreateBranchInput = z.infer<typeof createBranchSchema>

export const createCategorySchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().optional(),
  parentId: catalogIdSchema.optional(),
  image: z.string().optional(),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  isVisible: z.boolean().default(true),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const createProductSchema = z.object({
  barcode: z.string().optional(),
  sku: z.string().optional(),
  slug: z.string().optional(),
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  categoryId: catalogIdSchema.optional(),
  price: positiveNumberSchema,
  offerPrice: z.coerce.number().positive().optional(),
  wholesalePrice: z.coerce.number().positive().optional(),
  compareAtPrice: z.coerce.number().positive().optional(),
  costPrice: z.coerce.number().positive().optional(),
  unit: z.string().min(1, 'Unit is required'),
  weight: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().nonnegative().default(0),
  minStock: z.coerce.number().int().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
  imageAlt: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  publishStatus: z.enum(['draft', 'published']).default('published'),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

/** Admin product update — all fields optional for partial updates. */
export const updateProductSchema = createProductSchema.partial()
export type UpdateProductInput = z.infer<typeof updateProductSchema>

// ============================================
// MEDIA (Cloudinary-backed)
// ============================================

export const mediaResourceTypeSchema = z.enum(['image', 'video', 'auto'])

/** A single Cloudinary media record to persist to D1 (after a successful upload). */
export const mediaRecordSchema = z.object({
  cloudinaryPublicId: z.string().min(1, 'cloudinaryPublicId is required'),
  secureUrl: z.string().url('Invalid secure URL'),
  width: z.coerce.number().int().nonnegative().optional(),
  height: z.coerce.number().int().nonnegative().optional(),
  format: z.string().optional(),
  resourceType: mediaResourceTypeSchema.default('image'),
  alt: z.string().optional(),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
  isPrimary: z.boolean().default(false),
})

export type MediaRecordInput = z.infer<typeof mediaRecordSchema>

/** Payload to attach a media record to a product after a Cloudinary upload. */
export const attachProductMediaSchema = z.object({
  productId: uuidSchema,
  media: mediaRecordSchema,
})

export type AttachProductMediaInput = z.infer<typeof attachProductMediaSchema>

/** Payload to attach a media record to a category after a Cloudinary upload. */
export const attachCategoryMediaSchema = z.object({
  categoryId: uuidSchema,
  media: mediaRecordSchema,
})

export type AttachCategoryMediaInput = z.infer<typeof attachCategoryMediaSchema>

/** Reorder / set-primary media for a product. */
export const updateProductMediaOrderSchema = z.object({
  productId: uuidSchema,
  media: z.array(
    z.object({
      id: uuidSchema,
      displayOrder: z.coerce.number().int().nonnegative().default(0),
      isPrimary: z.boolean().default(false),
    })
  ),
})

export type UpdateProductMediaOrderInput = z.infer<typeof updateProductMediaOrderSchema>

/** Delete a media record (and its Cloudinary asset server-side). */
export const deleteMediaSchema = z.object({
  id: uuidSchema,
})

export type DeleteMediaInput = z.infer<typeof deleteMediaSchema>

export const createCustomerSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().optional(),
  phone: z.string().optional(),
  email: emailSchema.optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>

export const createOrderSchema = z.object({
  customerId: uuidSchema.optional(),
  branchId: uuidSchema.optional(),
  status: z.enum(['new', 'accepted', 'preparing', 'packed', 'out_for_delivery', 'delivered', 'cancelled']).default('new'),
  paymentMethod: z.enum(['cash', 'card', 'wallet', 'bank_transfer']).default('cash'),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).default('pending'),
  discountType: z.enum(['percentage', 'fixed_price', 'buy_x_get_y']).optional(),
  discountValue: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
  source: z.enum(['website', 'mobile', 'admin', 'whatsapp', 'facebook']).default('admin'),
  items: z.array(
    z.object({
      productId: uuidSchema,
      quantity: z.coerce.number().int().positive(),
      unitPrice: z.coerce.number().positive(),
      discount: z.coerce.number().nonnegative().default(0),
    })
  ).min(1, 'At least one item is required'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export const createOfferSchema = z.object({
  titleAr: z.string().min(1, 'Arabic title is required'),
  titleEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  banner: z.string().url().optional(),
  type: z.enum(['percentage', 'fixed_price', 'buy_x_get_y']).default('percentage'),
  value: z.coerce.number().positive('Discount value must be positive'),
  minOrderAmount: z.coerce.number().nonnegative().optional(),
  maxDiscountAmount: z.coerce.number().nonnegative().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(true),
})

export type CreateOfferInput = z.infer<typeof createOfferSchema>

export const createDriverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  vehicleType: z.string().optional(),
  vehiclePlate: z.string().optional(),
  status: z.enum(['available', 'busy', 'offline']).default('available'),
  branchId: uuidSchema.optional(),
})

export type CreateDriverInput = z.infer<typeof createDriverSchema>

export const createStockAdjustmentSchema = z.object({
  productId: uuidSchema,
  quantity: z.coerce.number().int().int().positive('Quantity must be non-zero'),
  reason: z.string().min(1, 'Reason is required'),
  referenceType: z.string().optional(),
  referenceId: uuidSchema.optional(),
  createdBy: uuidSchema.optional(),
})

export type CreateStockAdjustmentInput = z.infer<typeof createStockAdjustmentSchema>

export const createSupplierSchema = z.object({
  nameAr: z.string().min(1, 'Arabic name is required'),
  nameEn: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: emailSchema.optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>

export const createReturnSchema = z.object({
  returnNumber: z.string().min(1, 'Return number is required'),
  orderId: uuidSchema.optional(),
  customerId: uuidSchema.optional(),
  reason: z.string().min(1, 'Reason is required'),
  totalRefund: z.coerce.number().nonnegative().default(0),
  items: z.array(
    z.object({
      productId: uuidSchema,
      quantity: z.coerce.number().int().positive(),
      unitPrice: z.coerce.number().positive(),
    })
  ).min(1, 'At least one item is required'),
})

export type CreateReturnInput = z.infer<typeof createReturnSchema>

export const createFeatureFlagSchema = z.object({
  key: z.string().min(1, 'Key is required').regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'),
  groupId: uuidSchema.optional(),
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  isEnabled: z.boolean().default(false),
  value: z.record(z.string(), z.unknown()).optional(),
})

export type CreateFeatureFlagInput = z.infer<typeof createFeatureFlagSchema>

// ============================================
// OFFERS (admin-managed campaigns)
// ============================================

export const offerStatusSchema = z.enum(['active', 'inactive', 'scheduled', 'expired'])
export const offerDiscountTypeSchema = z.enum(['percentage', 'fixed_price', 'buy_x_get_y'])

/** Validates the raw JSON `product_ids` payload passed by the admin UI. */
export const adminOfferSchema = z
  .object({
    campaignName: z.string().min(1, 'اسم العرض مطلوب'),
    banner: z.string().optional(),
    discountType: offerDiscountTypeSchema.default('percentage'),
    value: z.coerce.number().positive('قيمة الخصم يجب أن تكون موجبة').optional(),
    buyX: z.coerce.number().int().positive().optional(),
    getY: z.coerce.number().int().positive().optional(),
    productIds: z.array(z.string().min(1)).min(1, 'اختر منتجاً واحداً على الأقل'),
    startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
    endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
    status: offerStatusSchema.default('scheduled'),
    isFeatured: z.boolean().default(false),
  })
  .refine((data) => {
    // Every date must be a valid ISO instant.
    return !Number.isNaN(new Date(data.startDate).getTime()) && !Number.isNaN(new Date(data.endDate).getTime())
  }, 'التواريخ يجب أن تكون صحيحة')
  .refine((data) => {
    // percentage and fixed_price require a value
    if (data.discountType === 'percentage' || data.discountType === 'fixed_price') {
      return data.value != null && data.value > 0
    }
    return true
  }, 'قيمة الخصم مطلوبة للنسبة المئوية والسعر الثابت')

export type AdminOfferInput = z.infer<typeof adminOfferSchema>

// ============================================
// SOCIAL POSTS (admin-managed)
// ============================================

export const socialPlatformSchema = z.enum(['facebook', 'instagram', 'tiktok', 'whatsapp'])

export const createSocialPostSchema = z.object({
  platform: socialPlatformSchema,
  url: z.string().min(1, 'رابط المنشور مطلوب'),
  thumbnail: z.string().optional(),
  title: z.string().min(1, 'عنوان المنشور مطلوب'),
  caption: z.string().optional(),
  postDate: z.string().min(1, 'تاريخ النشر مطلوب'),
  featured: z.boolean().default(false),
  linkedOfferId: z.string().optional().nullable(),
  isVisible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
})

export const updateSocialPostSchema = createSocialPostSchema.partial()
export type CreateSocialPostInput = z.infer<typeof createSocialPostSchema>
export type UpdateSocialPostInput = z.infer<typeof updateSocialPostSchema>

// ============================================
// SITE SETTINGS (admin-managed business info)
// ============================================

export const siteSettingsSchema = z.object({
  name: z.string().min(1, 'اسم المتجر مطلوب').optional(),
  nameEn: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  addressLines: z.array(z.string()).optional(),
  phoneMain: z.string().optional(),
  phoneAlt: z.string().optional(),
  whatsapp: z.string().optional(),
  social: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
    })
    .optional(),
  hero: z
    .object({
      image: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      ctaLabel: z.string().optional(),
      whatsappCtaLabel: z.string().optional(),
      alt: z.string().optional(),
    })
    .optional(),
})

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>

// ============================================
// PROMOS / CONTENT
// ============================================

export const promoPlacementSchema = z.enum([
  'hero',
  'deals_strip',
  'homepage_cta',
  'category_banner',
  'popup',
  'offers_banner',
])

export type PromoPlacementInput = z.infer<typeof promoPlacementSchema>

export const createPromoSchema = z.object({
  placement: promoPlacementSchema,
  categoryId: catalogIdSchema.optional().nullable(),
  imageUrl: z.string().min(1, 'Image URL is required'),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().url('Invalid URL').optional().nullable(),
  startAt: z.string().min(1, 'Start date is required'),
  endAt: z.string().min(1, 'End date is required'),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  publishStatus: z.enum(['draft', 'published']).default('published'),
  frequency: z.enum(['once_per_session', 'every_visit']).default('every_visit'),
})

export const updatePromoSchema = createPromoSchema.partial()

export type CreatePromoInput = z.infer<typeof createPromoSchema>
export type UpdatePromoInput = z.infer<typeof updatePromoSchema>

// ============================================
// MEDIA LIBRARY
// ============================================

export const mediaLibrarySchema = z.object({
  url: z.string().url('Invalid URL'),
  cloudinaryPublicId: z.string().min(1),
  filename: z.string().min(1),
  altText: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export type MediaLibraryInput = z.infer<typeof mediaLibrarySchema>

// ============================================
// DEAL HISTORY
// ============================================

export const createDealSchema = z.object({
  productId: catalogIdSchema,
  discountPct: z.coerce.number().int().min(1).max(99).optional(),
  fixedDiscount: z.coerce.number().positive().optional(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
})

export type CreateDealInput = z.infer<typeof createDealSchema>

// ============================================
// IMPORT JOBS
// ============================================

export const importTypeSchema = z.enum(['excel', 'csv', 'pdf'])

export const importJobSchema = z.object({
  type: importTypeSchema,
  filename: z.string().min(1),
  status: z.enum(['pending', 'validated', 'committed', 'failed']).default('pending'),
  rowCount: z.coerce.number().int().nonnegative().default(0),
  errorCount: z.coerce.number().int().nonnegative().default(0),
  errorLog: z.string().optional().nullable(),
})

export type ImportJobInput = z.infer<typeof importJobSchema>

// ============================================
// STAFF PERMISSIONS
// ============================================

export const staffPermissionsSchema = z.object({
  staffId: catalogIdSchema,
  canEditProducts: z.boolean().default(true),
  canEditPrices: z.boolean().default(true),
  canEditPromos: z.boolean().default(true),
  canManageStaff: z.boolean().default(false),
  canViewReports: z.boolean().default(true),
})

export type StaffPermissionsInput = z.infer<typeof staffPermissionsSchema>

// ============================================
// BULK PRODUCT ACTIONS
// ============================================

export const bulkActionTypeSchema = z.enum([
  'price_adjust',
  'apply_deal',
  'remove_deal',
  'stock_update',
  'status_change',
  'category_reassign',
  'delete',
])

export const bulkPriceAdjustSchema = z.object({
  mode: z.enum(['fixed', 'percentage']),
  value: z.coerce.number().positive('Value is required'),
})

export const bulkStockUpdateSchema = z.object({
  mode: z.enum(['add', 'set']),
  value: z.coerce.number().int(),
})

export const bulkActionSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1, 'Select at least one product'),
  action: bulkActionTypeSchema,
  payload: z
    .object({
      priceAdjust: bulkPriceAdjustSchema.optional(),
      deal: createDealSchema.partial().optional(),
      stock: bulkStockUpdateSchema.optional(),
      status: z.enum(['active', 'inactive', 'archived']).optional(),
      publishStatus: z.enum(['draft', 'published']).optional(),
      categoryId: catalogIdSchema.optional().nullable(),
    })
    .optional(),
})

export type BulkActionInput = z.infer<typeof bulkActionSchema>

// ============================================
// SITE STRUCTURE (admin-managed layout & content)
// ============================================

export const linkTargetSchema = z.enum(['internal', 'external'])
export type LinkTargetInput = z.infer<typeof linkTargetSchema>

export const footerSectionSchema = z.enum(['quick_links', 'contact', 'social'])
export type FooterSectionInput = z.infer<typeof footerSectionSchema>

export const homepageSectionKeySchema = z.enum([
  'hero',
  'deals_strip',
  'products',
  'social_strip',
])
export type HomepageSectionKeyInput = z.infer<typeof homepageSectionKeySchema>

export const seoPageKeySchema = z.enum(['homepage', 'category', 'product'])
export type SeoPageKeyInput = z.infer<typeof seoPageKeySchema>

export const createNavLinkSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  url: z.string().min(1, 'URL is required'),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  visible: z.boolean().default(true),
  target: linkTargetSchema.default('internal'),
})
export type CreateNavLinkInput = z.infer<typeof createNavLinkSchema>

export const updateNavLinkSchema = createNavLinkSchema.partial()
export type UpdateNavLinkInput = z.infer<typeof updateNavLinkSchema>

export const reorderItemsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one id is required'),
})
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>

export const createFooterLinkSchema = z.object({
  section: footerSectionSchema,
  label: z.string().min(1, 'Label is required'),
  url: z.string().min(1, 'URL is required'),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  visible: z.boolean().default(true),
})
export type CreateFooterLinkInput = z.infer<typeof createFooterLinkSchema>

export const updateFooterLinkSchema = createFooterLinkSchema.partial()
export type UpdateFooterLinkInput = z.infer<typeof updateFooterLinkSchema>

export const updateHomepageSectionSchema = z.object({
  visible: z.boolean().optional(),
  sortOrder: z.coerce.number().int().nonnegative().optional(),
})
export type UpdateHomepageSectionInput = z.infer<typeof updateHomepageSectionSchema>

export const createHomepageSectionSchema = z.object({
  sectionKey: homepageSectionKeySchema,
  visible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
})
export type CreateHomepageSectionInput = z.infer<typeof createHomepageSectionSchema>

export const createDeliveryZoneSchema = z.object({
  areaName: z.string().min(1, 'Area name is required'),
  deliveryFee: z.coerce.number().nonnegative().default(0),
  estimatedTime: z.string().default(''),
  active: z.boolean().default(true),
})
export type CreateDeliveryZoneInput = z.infer<typeof createDeliveryZoneSchema>

export const updateDeliveryZoneSchema = createDeliveryZoneSchema.partial()
export type UpdateDeliveryZoneInput = z.infer<typeof updateDeliveryZoneSchema>

export const createStaticPageSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  published: z.boolean().default(false),
})
export type CreateStaticPageInput = z.infer<typeof createStaticPageSchema>

export const updateStaticPageSchema = createStaticPageSchema.partial()
export type UpdateStaticPageInput = z.infer<typeof updateStaticPageSchema>

export const createSeoSettingsSchema = z.object({
  pageKey: seoPageKeySchema,
  metaTitleTemplate: z.string().min(1, 'Meta title template is required'),
  metaDescriptionTemplate: z.string().min(1, 'Meta description template is required'),
  ogImageDefault: z.string().url('Invalid URL').optional().nullable(),
})
export type CreateSeoSettingsInput = z.infer<typeof createSeoSettingsSchema>

export const updateSeoSettingsSchema = createSeoSettingsSchema.partial()
export type UpdateSeoSettingsInput = z.infer<typeof updateSeoSettingsSchema>

export const updateSiteSettingsExtSchema = z.object({
  minOrderValue: z.coerce.number().nonnegative().optional(),
  freeDeliveryThreshold: z.coerce.number().nonnegative().optional(),
  defaultDeliveryFee: z.coerce.number().nonnegative().optional(),
  updatedBy: z.string().optional(),
})
export type UpdateSiteSettingsExtInput = z.infer<typeof updateSiteSettingsExtSchema>

// ============================================
// GENERAL SITE SETTINGS (site_settings table)
// ============================================

export const generalSiteSettingsSchema = z.object({
  businessName: z.string().min(1, 'اسم المتجر مطلوب').optional(),
  logoUrl: z.string().url('رابط الشعار غير صالح').nullable().optional(),
  phonePrimary: z.string().optional(),
  phoneSecondary: z.string().optional(),
  address: z.string().optional(),
  whatsappNumber: z.string().optional(),
  facebookUrl: z.string().url('رابط فيسبوك غير صالح').nullable().optional(),
  instagramUrl: z.string().url('رابط انستجرام غير صالح').nullable().optional(),
  tiktokUrl: z.string().url('رابط تيك توك غير صالح').nullable().optional(),
  minOrderValue: z.coerce.number().nonnegative().optional(),
  freeDeliveryThreshold: z.coerce.number().nonnegative().optional(),
  defaultDeliveryFee: z.coerce.number().nonnegative().optional(),
})
export type GeneralSiteSettingsInput = z.infer<typeof generalSiteSettingsSchema>

// ============================================
// CATEGORY REORDER + DELETE DEPENDENCY
// ============================================

export const reorderCategoriesSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one id is required'),
})
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>

export const deleteCategorySchema = z.object({
  reassignTo: z.string().min(1).optional(),
})
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>

