import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { orders, orderStatusHistory } from '@/db/schema/orders'
import { products } from '@/db/schema/catalog'
import { notifications } from '@/db/schema/operations'
import { desc, sql } from 'drizzle-orm'

/**
 * Realtime SSE endpoint.
 *
 * Replaces Supabase Realtime. Uses a Server-Sent Events stream.
 *
 * IMPORTANT: SSE is NOT durable messaging. If a client disconnects it will
 * miss events that occurred while it was offline. For events that must
 * survive disconnection, consumers should read persisted records instead
 * (e.g. the `notifications` table or order event rows) — SSE here is a
 * lightweight push channel layered on top of D1 as the source of truth.
 *
 * Supported topics:
 *   - new_order              (recent orders)
 *   - order_status_changed   (recent order_status_history)
 *   - low_stock              (products.stock <= min_stock)
 *   - notification_created   (recent notifications)
 *   - notification_read      (recently read notifications)
 *   - product_stock_changed  (products with recent updated_at)
 */

export const dynamic = 'force-dynamic'

type Topic =
  | 'new_order'
  | 'order_status_changed'
  | 'low_stock'
  | 'notification_created'
  | 'notification_read'
  | 'product_stock_changed'

const VALID_TOPICS: Topic[] = [
  'new_order',
  'order_status_changed',
  'low_stock',
  'notification_created',
  'notification_read',
  'product_stock_changed',
]

function topicToEventName(topic: Topic): string {
  switch (topic) {
    case 'new_order': return 'order.created'
    case 'order_status_changed': return 'order.status_changed'
    case 'low_stock': return 'stock.low'
    case 'notification_created': return 'notification.created'
    case 'notification_read': return 'notification.read'
    case 'product_stock_changed': return 'product.stock_changed'
  }
}

function isTopic(value: string | null): value is Topic {
  return !!value && (VALID_TOPICS as string[]).includes(value)
}

/**
 * Read the latest relevant rows for a topic from D1.
 * Used both for the initial snapshot and periodic polling.
 */
async function queryTopic(topic: Topic): Promise<unknown[]> {
  switch (topic) {
    case 'new_order': {
      return db
        .select({
          id: orders.id,
          orderNumber: orders.order_number,
          status: orders.status,
          total: orders.total,
          createdAt: orders.created_at,
        })
        .from(orders)
        .orderBy(desc(orders.created_at))
        .limit(10)
    }
    case 'order_status_changed': {
      return db
        .select({
          id: orderStatusHistory.id,
          orderId: orderStatusHistory.order_id,
          toStatus: orderStatusHistory.to_status,
          createdAt: orderStatusHistory.created_at,
        })
        .from(orderStatusHistory)
        .orderBy(desc(orderStatusHistory.created_at))
        .limit(10)
    }
    case 'low_stock': {
      return db
        .select({
          id: products.id,
          nameAr: products.name_ar,
          stock: products.stock,
          minStock: products.min_stock,
        })
        .from(products)
        .where(sql`${products.stock} <= ${products.min_stock}`)
        .limit(10)
    }
    case 'notification_created': {
      return db
        .select({
          id: notifications.id,
          type: notifications.type,
          isRead: notifications.is_read,
          createdAt: notifications.created_at,
        })
        .from(notifications)
        .orderBy(desc(notifications.created_at))
        .limit(10)
    }
    case 'notification_read': {
      return db
        .select({
          id: notifications.id,
          type: notifications.type,
          isRead: notifications.is_read,
          readAt: notifications.read_at,
        })
        .from(notifications)
        .where(sql`${notifications.is_read} = true`)
        .orderBy(desc(notifications.read_at))
        .limit(10)
    }
    case 'product_stock_changed': {
      return db
        .select({
          id: products.id,
          nameAr: products.name_ar,
          stock: products.stock,
          updatedAt: products.updated_at,
        })
        .from(products)
        .orderBy(desc(products.updated_at))
        .limit(10)
    }
  }
}
export async function GET(request: NextRequest) {
  const topicParam = request.nextUrl.searchParams.get('topic')
  const topic = isTopic(topicParam) ? topicParam : 'new_order'
  const eventName = topicToEventName(topic)

  const encoder = new TextEncoder()

  let lastSnapshot = ''

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: { event: string; data: Record<string, unknown> }) => {
        controller.enqueue(encoder.encode(`event: ${payload.event}\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload.data)}\n\n`))
      }

      // Initial snapshot.
      try {
        const rows = await queryTopic(topic)
        lastSnapshot = JSON.stringify(rows)
        send({
          event: eventName,
          data: { snapshot: rows, topic, ts: new Date().toISOString() },
        })
        send({
          event: 'ready',
          data: { topic, ts: new Date().toISOString() },
        })
      } catch (err) {
        send({ event: 'error', data: { message: 'Initial query failed', topic } })
      }

      // Poll D1 for changes and emit when the result set changes.
      const interval = setInterval(async () => {
        try {
          const rows = await queryTopic(topic)
          const snapshot = JSON.stringify(rows)
          if (snapshot === lastSnapshot) return
          lastSnapshot = snapshot
          send({
            event: eventName,
            data: { rows, topic, ts: new Date().toISOString() },
          })
        } catch (err) {
          // Poll errors are non-fatal; keep the stream alive.
          send({ event: 'error', data: { message: 'Poll failed', topic } })
        }
      }, 3000)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function POST(): Promise<NextResponse> {
  // POST is intentionally unsupported on this endpoint.
  // Realtime pushes originate from server-side mutations, not from clients.
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
