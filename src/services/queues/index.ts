/**
 * Queue Consumer Dispatcher
 *
 * Routes an incoming queue message to the correct business handler.
 * Import this from the Cloudflare queue-consumer adapter or a standalone
 * Worker entry to process ORDER_QUEUE / NOTIFICATION_QUEUE batches.
 */

import type { QueueMessage } from '@/lib/cloudflare/queues'
import { handleOrderQueueMessage } from './order-queue'
import { handleNotificationQueueMessage } from './notification-queue'
import { logger } from '@/lib/logger'

/**
 * Dispatch a single queue message to the authoritative handler.
 */
export async function processQueueMessage(message: QueueMessage): Promise<void> {
  switch (message.type) {
    case 'order.created':
    case 'order.updated':
    case 'order.cancelled':
      await handleOrderQueueMessage(message)
      break
    case 'notification.push':
    case 'notification.email':
    case 'notification.sms':
      await handleNotificationQueueMessage(message)
      break
    default:
      logger.warn('Queues: unhandled message type', { type: (message as QueueMessage & { type: string }).type })
  }
}

export { handleOrderQueueMessage } from './order-queue'
export { handleNotificationQueueMessage } from './notification-queue'