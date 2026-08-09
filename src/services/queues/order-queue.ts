/**
 * Order Queue Consumer — business logic for ORDER_QUEUE messages.
 *
 * Runs inside a Cloudflare Queue consumer. D1 is the source of truth; this
 * handler performs follow-up work that must NOT block the customer's request:
 *   - persisted notifications / timeline events
 *   - cached aggregate invalidation
 *   - forwarding push work to the NOTIFICATION_QUEUE
 *
 * See `src/lib/cloudflare/queue-consumer.ts` for Worker wiring.
 */

import type { OrderQueueMessage } from '@/lib/cloudflare/queues'
import { getDb } from '@/db'
import { notifications, orderStatusHistory } from '@/db/schema'
import { kvDelete } from '@/lib/cloudflare/kv'
import { queueNotification } from '@/lib/cloudflare/queues'
import { logger } from '@/lib/logger'

const CACHE_KEYS_TO_INVALIDATE = [
  'dashboard:orders',
  'dashboard:totals',
  'orders:recent',
  'orders:count',
]

/**
 * Handle a single ORDER_QUEUE message.
 */
export async function handleOrderQueueMessage(message: OrderQueueMessage): Promise<void> {
  switch (message.type) {
    case 'order.created':
      await handleOrderCreated(message)
      break
    case 'order.updated':
      await handleOrderUpdated(message)
      break
    case 'order.cancelled':
      await handleOrderCancelled(message)
      break
    default:
      logger.warn('Queues: unknown order message type', { type: (message as { type: string }).type })
  }
}

async function handleOrderCreated(message: OrderQueueMessage): Promise<void> {
  const db = getDb()
  const now = new Date().toISOString()

  logger.info('Queues: processing order.created', { orderId: message.orderId })

  // Persist a notification so admins who were disconnected still see it later.
  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    user_id: message.userId ?? null, // null = broadcast to all staff
    type: 'new_order',
    title: 'طلب جديد',
    body: `تم استلام طلب جديد #${message.orderId}`,
    severity: 'info',
    is_read: false,
    entity: 'order',
    entity_id: message.orderId,
    metadata: JSON.stringify({ payload: message.payload ?? {} }),
    created_at: now,
  }).onConflictDoNothing()

  // Purge cached dashboard aggregates so they refetch from D1.
  for (const key of CACHE_KEYS_TO_INVALIDATE) {
    await kvDelete(key)
  }

  // Forward a push notification through the NOTIFICATION_QUEUE (non-blocking).
  await queueNotification(
    message.userId ?? 'all-staff',
    'push',
    'طلب جديد',
    `طلب جديد #${message.orderId}`,
    { orderId: message.orderId }
  )
}

async function handleOrderUpdated(message: OrderQueueMessage): Promise<void> {
  const db = getDb()
  const now = new Date().toISOString()
  const payload = message.payload ?? {}
  const toStatus = typeof payload.status === 'string' ? payload.status : null

  logger.info('Queues: processing order.updated', { orderId: message.orderId, toStatus })

  if (toStatus) {
    // The status change is already recorded in the request path; here we only
    // surface a notification (the durable audit row lives in D1 regardless).
    await db.insert(orderStatusHistory).values({
      id: crypto.randomUUID(),
      order_id: message.orderId,
      from_status: typeof payload.fromStatus === 'string' ? (payload.fromStatus as never) : null,
      to_status: toStatus as never,
      changed_by: message.userId ?? null,
      note: typeof payload.note === 'string' ? payload.note : null,
      created_at: now,
    }).onConflictDoNothing()
  }

  for (const key of CACHE_KEYS_TO_INVALIDATE) {
    await kvDelete(key)
  }
}

async function handleOrderCancelled(message: OrderQueueMessage): Promise<void> {
  const db = getDb()
  const now = new Date().toISOString()

  logger.info('Queues: processing order.cancelled', { orderId: message.orderId })

  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    user_id: null,
    type: 'cancelled_order',
    title: 'إلغاء طلب',
    body: `تم إلغاء الطلب #${message.orderId}`,
    severity: 'warning',
    is_read: false,
    entity: 'order',
    entity_id: message.orderId,
    metadata: JSON.stringify({ payload: message.payload ?? {} }),
    created_at: now,
  }).onConflictDoNothing()

  for (const key of CACHE_KEYS_TO_INVALIDATE) {
    await kvDelete(key)
  }
}