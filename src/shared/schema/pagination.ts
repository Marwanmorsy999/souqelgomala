/**
 * Shared Zod schemas — pagination & list query params
 *
 * Used by list endpoints and UI query-state to keep page size and
 * sort parameters consistent across the app.
 */

import { z } from 'zod'
import { nonNegativeIntSchema } from './common'

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export const pageSchema = z
  .number()
  .int()
  .min(1, 'رقم الصفحة يبدأ من 1')
  .default(1)

export const pageSizeSchema = z
  .number()
  .int()
  .min(1, 'حجم الصفحة على الأقل 1')
  .max(MAX_PAGE_SIZE, `أقصى حجم صفحة ${MAX_PAGE_SIZE}`)
  .default(DEFAULT_PAGE_SIZE)

/** Offset computed from page + pageSize. Safe: clamps to non-negative. */
export const offsetSchema = z
  .object({
    page: pageSchema,
    pageSize: pageSizeSchema,
  })
  .transform(({ page, pageSize }) => ({ page, pageSize, offset: (page - 1) * pageSize }))

/** Generic list query params shared by all list endpoints. */
export const listQuerySchema = z.object({
  page: pageSchema,
  pageSize: pageSizeSchema,
  search: z.string().trim().max(120).optional(),
  sortBy: z.string().min(1).max(64).optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
})

export const idParamsSchema = z.object({
  id: z.string().uuid(),
})

export type ListQuery = z.infer<typeof listQuerySchema>
export type OffsetResult = z.infer<typeof offsetSchema>
export type IdParams = z.infer<typeof idParamsSchema>

/** Validate a raw list query object (e.g., from URL search params). */
export function parseListQuery(input: unknown): ListQuery {
  return listQuerySchema.parse(input)
}

/** Safe alternative that never throws — falls back to defaults. */
export function safeParseListQuery(input: unknown): ListQuery {
  const result = listQuerySchema.safeParse(input)
  if (result.success) return result.data
  return {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortDir: 'desc',
  }
}

/** Re-export shared integer schema for downstream list builders. */
export { nonNegativeIntSchema }

