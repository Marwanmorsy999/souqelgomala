/**
 * Cloudflare Queue Consumer Adapter
 *
 * A Next.js app deployed with @opennextjs/cloudflare cannot host a queue
 * consumer in the same compiled worker as the web app. In production you deploy
 * a small **standalone Worker** that owns the Queue bindings and forwards each
 * message to the shared business handlers in `src/services/queues/`.
 *
 * Minimal standalone Worker entry (`worker/queue-consumer.ts`):
 *
 *   import { processQueueMessage } from '../src/services/queues'
 *
 *   export interface Env {
 *     DB: D1Database
 *     CACHE: KVNamespace
 *   }
 *
 *   export default {
 *     async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext) {
 *       for (const message of batch.messages) {
 *         ctx.waitUntil(processQueueMessage(message.body))
 *       }
 *     },
 *   }
 *
 * The `queue`/`MessageBatch`/`ExecutionContext` types come from
 * `@cloudflare/workers-types`. Keep business logic in
 * `src/services/queues/*` (framework/Cloudflare-free) and only this thin shell
 * Cloudflare-specific.
 */

// Re-export the dispatcher so the standalone worker imports from one place.
export { processQueueMessage } from '@/services/queues'
export type { OrderQueueMessage, NotificationQueueMessage } from './queues'