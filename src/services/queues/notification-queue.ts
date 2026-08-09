/**
 * Notification Queue Consumer — business logic for NOTIFICATION_QUEUE messages.
 *
 * Dispatches a notification through the configured channels. Channel adapters
 * (email / SMS / push) are integration points: wire providers here later
 * (e.g. Resend for email, Twilio/Vonage for SMS, web-push/FCM for push).
 *
 * This milestone ships with NO-OP adapters that log instead of sending, so the
 * pipeline is testable end-to-end without external credentials.
 */

import type { NotificationQueueMessage } from '@/lib/cloudflare/queues'
import { getDb } from '@/db'
import { notifications } from '@/db/schema'
import { logger } from '@/lib/logger'

export interface ChannelAdapter {
  (message: NotificationQueueMessage): Promise<void>
}

/**
 * Integration points — replace the body of each adapter with a real provider.
 * Keep them out of the request path (they only run in the queue consumer).
 */
const EMAIL_ADAPTER: ChannelAdapter = async (message) => {
  logger.info('Queues[email]: would send email', { to: message.recipientId, subject: message.title })
  // TODO(Milestone 3): Resend / SendGrid integration.
}

const SMS_ADAPTER: ChannelAdapter = async (message) => {
  logger.info('Queues[sms]: would send SMS', { to: message.recipientId, body: message.body })
  // TODO(Milestone 3): Twilio / Vonage integration.
}

const PUSH_ADAPTER: ChannelAdapter = async (message) => {
  logger.info('Queues[push]: would send push', { to: message.recipientId, title: message.title })
  // TODO(Milestone 3): web-push / FCM integration.
}

/**
 * Handle a single NOTIFICATION_QUEUE message.
 */
export async function handleNotificationQueueMessage(message: NotificationQueueMessage): Promise<void> {
  switch (message.channel) {
    case 'email':
      await EMAIL_ADAPTER(message)
      break
    case 'sms':
      await SMS_ADAPTER(message)
      break
    case 'push':
    default:
      await PUSH_ADAPTER(message)
      break
  }

  // Persist a durable record for the recipient's inbox (survives disconnects).
  const db = getDb()
  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    user_id: message.recipientId === 'all-staff' ? null : message.recipientId,
    type: 'system',
    title: message.title,
    body: message.body,
    severity: 'info',
    is_read: false,
    entity: null,
    entity_id: null,
    metadata: JSON.stringify({ channel: message.channel, data: message.data ?? {} }),
    created_at: new Date().toISOString(),
  }).onConflictDoNothing()
}