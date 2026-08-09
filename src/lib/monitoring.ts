/**
 * Monitoring integration point
 *
 * Future home for Sentry / OpenTelemetry wiring. Currently a no-op facade
 * so feature code can instrument without depending on a concrete vendor.
 *
 * Decoupling rule (approved plan): logger, monitoring, and error handling
 * are separate modules and never import each other.
 */

export interface MonitoringUser {
  id: string
  email?: string
  role?: string
}

export interface Span {
  end(): void
}

function noopSpan(): Span {
  return { end: () => undefined }
}

export const monitoring = {
  /** Report a handled/unhandled exception. */
  captureException(error: unknown, context?: Record<string, unknown>): void {
    void error
    void context
    // No-op until Sentry/OTel is wired.
  },

  /** Report a message (warn-level semantics). */
  captureMessage(message: string, context?: Record<string, unknown>): void {
    void message
    void context
    // No-op until Sentry/OTel is wired.
  },

  /** Associate the current scope with an authenticated user. */
  setUser(user: MonitoringUser | null): void {
    void user
    // No-op until Sentry/OTel is wired.
  },

  /** Attach arbitrary context to the current scope. */
  setContext(name: string, data: Record<string, unknown>): void {
    void name
    void data
    // No-op until Sentry/OTel is wired.
  },

  /** Start a manual span. Returns a no-op span for now. */
  startSpan(name: string, attributes?: Record<string, unknown>): Span {
    void name
    void attributes
    return noopSpan()
  },
}

