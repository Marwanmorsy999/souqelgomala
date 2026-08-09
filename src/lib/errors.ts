/**
 * Shared application error codes
 *
 * Single source of truth for error codes used across client, server,
 * and Edge Functions. Edge Functions return `{ error: { code, message } }`
 * per ENGINEERING.md §11.
 */

export const ErrorCodes = {
  // Validation & input
  VALIDATION: 'validation_error',
  INVALID_INPUT: 'invalid_input',

  // Resource access
  NOT_FOUND: 'not_found',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  CONFLICT: 'conflict',

  // Rate limiting
  RATE_LIMITED: 'rate_limited',

  // Persistence / network
  NETWORK: 'network_error',
  TIMEOUT: 'timeout',
  STORAGE: 'storage_error',

  // Feature availability
  FEATURE_DISABLED: 'feature_disabled',
  NOT_IMPLEMENTED: 'not_implemented',

  // Fallback
  INTERNAL: 'internal_error',
  UNKNOWN: 'unknown_error',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/** Maps error codes to HTTP status codes (API/Edge conventions). */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  validation_error: 400,
  invalid_input: 400,
  not_found: 404,
  unauthorized: 401,
  forbidden: 403,
  conflict: 409,
  rate_limited: 429,
  network_error: 502,
  timeout: 504,
  storage_error: 500,
  feature_disabled: 404,
  not_implemented: 501,
  internal_error: 500,
  unknown_error: 500,
}

export interface AppErrorOptions {
  code?: ErrorCode
  status?: number
  details?: unknown
  cause?: unknown
}

/**
 * Typed application error. Prefer throwing `AppError` over raw `Error`
 * so UI/API layers can map codes to user messages and HTTP statuses.
 */
export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details?: unknown

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'AppError'
    this.code = options.code ?? ErrorCodes.INTERNAL
    this.status = options.status ?? ERROR_STATUS[this.code]
    this.details = options.details
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
    }
  }
}

/** Type guard for AppError. */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/** Normalize any thrown value into a descriptive message (safe for UI). */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'حدث خطأ غير متوقع'
}

/** Coerce unknown throws into an AppError (preserving the original). */
export function toAppError(error: unknown, fallbackMessage = 'حدث خطأ غير متوقع'): AppError {
  if (isAppError(error)) return error
  if (error instanceof Error) {
    return new AppError(error.message || fallbackMessage, { cause: error })
  }
  return new AppError(fallbackMessage, { code: ErrorCodes.UNKNOWN, cause: error })
}

/** Map common database error codes (PostgreSQL/D1-SQLite) to application codes. */
export function fromDatabaseError(
  code: string | undefined,
  message: string,
  details?: unknown
): AppError {
  switch (code) {
    case '23505':
      return new AppError('يوجد سجل مكرر', {
        code: ErrorCodes.CONFLICT,
        status: 409,
        details,
      })
    case '23503':
      return new AppError('السجل مرتبط ببيانات أخرى', {
        code: ErrorCodes.CONFLICT,
        status: 409,
        details,
      })
    case '23514':
      return new AppError('قيمة غير صالحة', {
        code: ErrorCodes.VALIDATION,
        status: 400,
        details,
      })
    case '42501':
      return new AppError('ليست لديك صلاحية لهذا الإجراء', {
        code: ErrorCodes.FORBIDDEN,
        status: 403,
        details,
      })
    case 'PGRST116':
      return new AppError('غير موجود', {
        code: ErrorCodes.NOT_FOUND,
        status: 404,
        details,
      })
    default:
      return new AppError(message, { code: ErrorCodes.INTERNAL, details })
  }
}

