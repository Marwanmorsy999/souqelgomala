/**
 * Bootstrap that MUST be imported (or --import'ed) before any next/* module.
 *
 * Next.js picks its request-scoped AsyncLocalStorage implementation at module
 * evaluation time: if `globalThis.AsyncLocalStorage` is missing it installs a
 * `FakeAsyncLocalStorage` whose `.run()` throws
 * "Invariant: AsyncLocalStorage accessed in runtime where it is not available".
 *
 * Real Node/Workers server runtimes expose this global. Providing it here is a
 * runtime-parity fix for the harness — it does NOT change app behaviour or
 * weaken authentication.
 */
import { AsyncLocalStorage } from 'node:async_hooks'

const g = globalThis as Record<string, unknown>
if (!g.AsyncLocalStorage) {
  g.AsyncLocalStorage = AsyncLocalStorage
}

export {}
