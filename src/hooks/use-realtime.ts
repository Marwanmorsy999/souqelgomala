'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Realtime subscription topics. Mirrors the supported topics of the SSE
 * endpoint at /api/realtime (see app/api/realtime/route.ts).
 */
export type RealtimeTopic =
  | 'new_order'
  | 'order_status_changed'
  | 'low_stock'
  | 'notification_created'
  | 'notification_read'
  | 'product_stock_changed'

const TOPIC_EVENTS: Record<RealtimeTopic, string> = {
  new_order: 'order.created',
  order_status_changed: 'order.status_changed',
  low_stock: 'stock.low',
  notification_created: 'notification.created',
  notification_read: 'notification.read',
  product_stock_changed: 'product.stock_changed',
}

interface UseRealtimeOptions {
  /** Invalidate the query with this key when changes arrive */
  queryKey: string[]
  /** Callback for every event payload */
  onEvent?: (payload: Record<string, unknown>) => void
  /** Enable/disable the subscription */
  enabled?: boolean
}

/**
 * Subscribe to a realtime topic (Server-Sent Events) and automatically
 * invalidate the matching TanStack Query key. Replaces Supabase Realtime.
 *
 * NOTE: SSE is not durable. If the client is disconnected it will miss events.
 * Combine with persisted data (notifications table, order history) for
 * catch-up reads — SSE is a low-latency push channel on top of D1.
 */
export function useRealtime({
  topic,
  queryKey,
  onEvent,
  enabled = true,
}: UseRealtimeOptions & { topic: RealtimeTopic }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    let eventSource: EventSource | null = null
    let retryCount = 0
    const maxRetries = 5

    function onPayload(raw: string) {
      try {
        const payload = JSON.parse(raw) as Record<string, unknown>
        queryClient.invalidateQueries({ queryKey })
        onEvent?.(payload)
      } catch {
        // Ignore parse errors
      }
    }

    function connect() {
      try {
        const params = new URLSearchParams({ topic })
        eventSource = new EventSource(`/api/realtime?${params}`)

        // Named event emitted by the SSE route.
        eventSource.addEventListener(TOPIC_EVENTS[topic], (e) => onPayload(e.data))
        // Fallback for default `message` events / `ready` / `error`.
        eventSource.onmessage = (e) => onPayload(e.data)

        eventSource.onerror = () => {
          eventSource?.close()
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(connect, Math.min(1000 * 2 ** retryCount, 30000))
          }
        }
      } catch {
        // Silently fail if EventSource is not available
      }
    }

    connect()

    return () => {
      eventSource?.close()
    }
  }, [topic, queryKey, onEvent, enabled, queryClient])
}

/**
 * Subscribe to a specific trending topic filtered to a single entity.
 * SSE does not support row-level filters over the wire; pass a `filter` value
 * that the route can apply to its query (e.g. an order id for status changes).
 */
export function useRealtimeRow({
  topic,
  id,
  queryKey,
  enabled = true,
}: {
  topic: RealtimeTopic
  id: string | undefined
  queryKey: string[]
  enabled?: boolean
}) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !id) return

    let eventSource: EventSource | null = null
    let retryCount = 0
    const maxRetries = 5

    function connect() {
      try {
        const params = new URLSearchParams({ topic })
        if (id) params.set('id', id)
        eventSource = new EventSource(`/api/realtime?${params}`)

        eventSource.addEventListener(TOPIC_EVENTS[topic], () => {
          queryClient.invalidateQueries({ queryKey })
        })
        eventSource.onmessage = () => {
          queryClient.invalidateQueries({ queryKey })
        }

        eventSource.onerror = () => {
          eventSource?.close()
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(connect, Math.min(1000 * 2 ** retryCount, 30000))
          }
        }
      } catch {
        // Silently fail
      }
    }

    connect()

    return () => {
      eventSource?.close()
    }
  }, [topic, id, queryKey, enabled, queryClient])
}


