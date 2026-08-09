/**
 * Standardized API Response Helpers
 *
 * Used by Cloudflare Workers / Next.js API routes.
 * Replaces Supabase response helpers.
 */

import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
  meta?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * Build a successful JSON response.
 */
export function ok<T>(data: T, status = 200): NextResponse {
  const body: ApiResponse<T> = { success: true, data }
  return NextResponse.json(body, { status })
}

/**
 * Build a paginated successful JSON response.
 */
export function paginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): NextResponse {
  const body: ApiResponse<T[]> = {
    success: true,
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
  return NextResponse.json(body)
}

/**
 * Build a failure JSON response with a single error message.
 */
export function fail(message: string, status = 400): NextResponse {
  const body: ApiResponse = { success: false, error: message }
  return NextResponse.json(body, { status })
}

/**
 * Build a failure JSON response with validation errors.
 */
export function validationError(errors: Record<string, string[]>): NextResponse {
  const body: ApiResponse = { success: false, errors }
  return NextResponse.json(body, { status: 422 })
}

/**
 * Build a 404 Not Found response.
 */
export function notFound(message = 'Resource not found'): NextResponse {
  const body: ApiResponse = { success: false, error: message }
  return NextResponse.json(body, { status: 404 })
}

/**
 * Build a 401 Unauthorized response.
 */
export function unauthorized(message = 'Unauthorized'): NextResponse {
  const body: ApiResponse = { success: false, error: message }
  return NextResponse.json(body, { status: 401 })
}

/**
 * Build a 403 Forbidden response.
 */
export function forbidden(message = 'Forbidden'): NextResponse {
  const body: ApiResponse = { success: false, error: message }
  return NextResponse.json(body, { status: 403 })
}

/**
 * Build a 500 Internal Server Error response.
 */
export function serverError(message = 'Internal server error'): NextResponse {
  const body: ApiResponse = { success: false, error: message }
  return NextResponse.json(body, { status: 500 })
}
