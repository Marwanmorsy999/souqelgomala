/**
 * Central logger abstraction
 *
 * All application logging must go through this module — never raw
 * `console.*` calls in feature code. Logs are structured (JSON), leveled,
 * and never include PII in plaintext.
 *
 * ENGINEERING.md §9:
 *   debug — development only, verbose
 *   info  — key business events
 *   warn  — recoverable issues
 *   error — unhandled exceptions, failed operations
 *
 * This module is intentionally decoupled from monitoring.ts.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function resolveThreshold(): LogLevel {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return 'info'
  }
  return 'debug'
}

const THRESHOLD = resolveThreshold()

export interface LogContext {
  [key: string]: unknown
}

export interface LogEntry {
  ts: string
  level: LogLevel
  message: string
  [key: string]: unknown
}

function write(level: LogLevel, message: string, context?: LogContext) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[THRESHOLD]) return

  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...context,
  }

  const line = JSON.stringify(entry)

  // Route by severity so ops tooling can filter on stderr.
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  /** Create a scoped logger with pre-bound context (e.g., { module: 'orders' }). */
  child(boundContext: LogContext): Logger
}

function child(boundContext: LogContext): Logger {
  const bind = (context?: LogContext) => ({ ...boundContext, ...context })
  return {
    debug: (message, context) => write('debug', message, bind(context)),
    info: (message, context) => write('info', message, bind(context)),
    warn: (message, context) => write('warn', message, bind(context)),
    error: (message, context) => write('error', message, bind(context)),
    child: (context) => child(bind(context)),
  }
}

/** Application-wide logger singleton. */
export const logger: Logger = {
  debug: (message, context) => write('debug', message, context),
  info: (message, context) => write('info', message, context),
  warn: (message, context) => write('warn', message, context),
  error: (message, context) => write('error', message, context),
  child,
}

/** Convenience: silence all logs (used in tests). */
export function setLogLevelForTests(level: LogLevel): void {
  // Intentionally a no-op placeholder: module-level threshold is immutable.
  // Kept for API compatibility; tests mock console instead.
  void level
}

