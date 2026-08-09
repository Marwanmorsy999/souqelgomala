/**
 * Shared Zod schemas — common primitives
 *
 * Reusable schemas for values that appear across many features.
 * Kept in `src/shared/schema` so both client and server code can import
 * them without crossing feature boundaries.
 */

import { z } from 'zod'

/** UUID (v4 shape is the common case, but accept any standard UUID) */
export const uuidSchema = z.string().uuid('معرّف غير صالح')

/** Trimmed non-empty Arabic/English string */
export const slugSchema = z
  .string()
  .min(1, 'مطلوب')
  .max(120, 'أقصى طول 120 حرف')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'سلج غير صالح')

/** Currency amount (EGP) — non-negative, up to 2 decimals */
export const moneySchema = z
  .number()
  .nonnegative('لا يمكن أن يكون سالباً')
  .max(99_999_999, 'قيمة كبيرة جداً')

/** Quantity — positive integer */
export const positiveIntSchema = z
  .number()
  .int('يجب أن يكون عدداً صحيحاً')
  .positive('يجب أن يكون أكبر من صفر')

/** Non-negative integer */
export const nonNegativeIntSchema = z
  .number()
  .int('يجب أن يكون عدداً صحيحاً')
  .nonnegative('لا يمكن أن يكون سالباً')

/** Percentage 0–100 */
export const percentSchema = z
  .number()
  .min(0, 'أقل من 0')
  .max(100, 'أكبر من 100')

/** ISO datetime string */
export const dateTimeSchema = z.string().datetime({ offset: true })

/** Optional ISO datetime string or null */
export const nullableDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional()

/** Phone number (Egyptian-friendly, lenient) */
export const phoneSchema = z
  .string()
  .min(8, 'رقم الهاتف قصير جداً')
  .max(20, 'رقم الهاتف طويل جداً')
  .regex(/^[+0-9\s-]+$/, 'رقم هاتف غير صالح')

/** Email address */
export const emailSchema = z.string().email('بريد إلكتروني غير صالح')

/** URL */
export const urlSchema = z.string().url('رابط غير صالح')

/** Free-form JSON value (settings, metadata) */
export const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)])
)

