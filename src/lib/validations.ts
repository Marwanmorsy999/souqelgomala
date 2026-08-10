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
  parentId: uuidSchema.optional(),
  image: z.string().url().optional(),
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
  categoryId: uuidSchema.optional(),
  price: positiveNumberSchema,
  offerPrice: z.coerce.number().positive().optional(),
  wholesalePrice: z.coerce.number().positive().optional(),
  compareAtPrice: z.coerce.number().positive().optional(),
  costPrice: z.coerce.number().positive().optional(),
  unit: z.string().min(1, 'Unit is required'),
  weight: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().nonnegative().default(0),
  minStock: z.coerce.number().int().nonnegative().default(0),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
  imageAlt: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
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
    productIds: z.array(z.string().min(1)).default([]),
    startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
    endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
    status: offerStatusSchema.default('scheduled'),
  })
  .refine((data) => {
    // Every date must be a valid ISO instant.
    return !Number.isNaN(new Date(data.startDate).getTime()) && !Number.isNaN(new Date(data.endDate).getTime())
  }, 'التواريخ يجب أن تكون صحيحة')

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

