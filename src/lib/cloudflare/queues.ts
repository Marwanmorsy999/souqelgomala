/**
 * Cloudflare Queues Abstraction
 *
 * Replaces Supabase Realtime / edge functions for async work.
 *
 * Queues used:
 *   - ORDER_QUEUE       → order creation, status transitions
 *   - NOTIFICATION_QUEUE → push notifications, SMS, email
 *
 * Producers push messages; consumers are separate Worker scripts
 * bound via wrangler.jsonc.
 */

import { logger } from '@/lib/logger'
import type { QueueBinding } from '@/types/cloudflare-bindings'

export interface OrderQueueMessage {
  type: 'order.created' | 'order.updated' | 'order.cancelled'
  orderId: string
  branchId: string
  userId?: string
  timestamp: string
  payload: Record<string, unknown>
}

export interface NotificationQueueMessage {
  type: 'notification.push' | 'notification.sms' | 'notification.email'
  recipientId: string
  channel: 'push' | 'sms' | 'email'
  title: string
  body: string
  data?: Record<string, unknown>
  timestamp: string
}

export type QueueMessage = OrderQueueMessage | NotificationQueueMessage

/**
 * Safely get the ORDER_QUEUE binding.
 */
function getOrderQueueBinding(): QueueBinding | null {
  const context = (globalThis as Record<symbol, unknown>)[Symbol.for('__cloudflare-context__')] as
    | { env?: Record<string, unknown> }
    | undefined
  const q = (context?.env?.ORDER_QUEUE ?? (globalThis as Record<string, unknown>).ORDER_QUEUE) as
    | QueueBinding
    | undefined
  if (!q) return null
  return q
}

/**
 * Safely get the NOTIFICATION_QUEUE binding.
 */
function getNotificationQueueBinding(): QueueBinding | null {
  const context = (globalThis as Record<symbol, unknown>)[Symbol.for('__cloudflare-context__')] as
    | { env?: Record<string, unknown> }
    | undefined
  const q = (context?.env?.NOTIFICATION_QUEUE ?? (globalThis as Record<string, unknown>).NOTIFICATION_QUEUE) as
    | QueueBinding
    | undefined
  if (!q) return null
  return q
}

/**
 * Send a message to the ORDER_QUEUE.
 */
export async function sendOrderMessage(message: OrderQueueMessage): Promise<void> {
  const queue = getOrderQueueBinding()
  if (!queue) {
    logger.warn('Queues: ORDER_QUEUE binding not available, skipping send')
    return
  }
  try {
    await queue.send(message)
    logger.info('Queues: order message sent', { type: message.type, orderId: message.orderId })
  } catch (err) {
    logger.error('Queues: failed to send order message', { error: err, message })
    throw err
  }
}

/**
 * Send a message to the NOTIFICATION_QUEUE.
 */
export async function sendNotification(message: NotificationQueueMessage): Promise<void> {
  const queue = getNotificationQueueBinding()
  if (!queue) {
    logger.warn('Queues: NOTIFICATION_QUEUE binding not available, skipping send')
    return
  }
  try {
    await queue.send(message)
    logger.info('Queues: notification sent', { type: message.type, channel: message.channel })
  } catch (err) {
    logger.error('Queues: failed to send notification', { error: err, message })
    throw err
  }
}

/**
 * Convenience: send an order.created event.
 */
export async function queueOrderCreated(
  orderId: string,
  branchId: string,
  userId?: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  await sendOrderMessage({
    type: 'order.created',
    orderId,
    branchId,
    userId,
    timestamp: new Date().toISOString(),
    payload,
  })
}

/**
 * Convenience: send a notification.
 */
export async function queueNotification(
  recipientId: string,
  channel: NotificationQueueMessage['channel'],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await sendNotification({
    type: `notification.${channel}`,
    recipientId,
    channel,
    title,
    body,
    data,
    timestamp: new Date().toISOString(),
  })
}

