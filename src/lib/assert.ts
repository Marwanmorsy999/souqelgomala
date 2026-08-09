/**
 * Internal runtime assertions
 *
 * Use for programmer errors (invariants, impossible states), NOT for
 * user-input validation. Throw `AssertionError` which fails fast in
 * development and documents assumptions at runtime.
 *
 * Prefer type-level guarantees; these are a last line of defense.
 */

export class AssertionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssertionError'
  }
}

/** Assert a boolean condition is truthy. */
export function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
  if (!condition) {
    throw new AssertionError(message)
  }
}

/** Assert a value is not null/undefined and return it (narrows type). */
export function assertDefined<T>(value: T | null | undefined, message = 'Expected value to be defined'): T {
  if (value === null || value === undefined) {
    throw new AssertionError(message)
  }
  return value
}

/** Assert a value is a non-empty string. */
export function assertNonEmpty(value: string, message = 'Expected a non-empty string'): string {
  if (value.trim().length === 0) {
    throw new AssertionError(message)
  }
  return value
}

/**
 * Exhaustiveness check for discriminated unions. Place in the `default`
 * branch of a switch; the compiler errors if a case is unhandled.
 */
export function assertNever(value: never, message = 'Unexpected value in exhaustive switch'): never {
  throw new AssertionError(`${message}: ${JSON.stringify(value)}`)
}

/** Assert the code is running in a specific environment (e.g., server-only). */
export function assertServerOnly(message = 'This code is only available on the server'): void {
  assert(typeof window === 'undefined', message)
}

/** Assert the code is running in the browser. */
export function assertBrowserOnly(message = 'This code is only available in the browser'): void {
  assert(typeof window !== 'undefined', message)
}

