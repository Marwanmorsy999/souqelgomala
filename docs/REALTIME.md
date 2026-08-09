# Realtime (SSE over D1 — replaces Supabase Realtime)

Supabase Realtime is removed. The app uses a **Server-Sent Events** (SSE)
endpoint at `/api/realtime`, with **D1 as the durable source of truth**.

## Design

```
Client (EventSource)
   │
   ▼
/api/realtime?topic=new_order     (SSE stream)
   │
   ▼
D1 polling (every 3s) → diff → push `event:`/`data:` frames
```

- The connection is a **low-latency push hint**, not durable messaging.
- **Durable** facts (notifications, order history) are written to D1 tables.
  A reconnecting client misses frames but can always catch up by querying D1.

## Supported topics

| topic                 | event name            | reads                                   |
| --------------------- | --------------------- | --------------------------------------- |
| `new_order`           | `order.created`       | recent `orders`                         |
| `order_status_changed`| `order.status_changed`| recent `order_status_history`           |
| `low_stock`           | `stock.low`           | products with `stock <= min_stock`      |
| `notification_created`| `notification.created`| recent `notifications`                 |
| `notification_read`   | `notification.read`   | recently-read notifications             |
| `product_stock_changed`| `product.stock_changed`| products ordered by `updated_at`      |

## Client hook

`src/hooks/use-realtime.ts` provides `useRealtime({ topic, queryKey, … })` and
`useRealtimeRow({ topic, id, queryKey, … })`. They open an `EventSource`,
listen for the named event, and invalidate the matching TanStack Query key so
UI refetches from D1.

## Server side

`app/api/realtime/route.ts`:

- `GET` → SSE stream (initial snapshot + 3s diff polling).
- `POST` → 405 (clients never push).

## Durability recommendation

Do **not** rely on SSE for guaranteed delivery. For must-survive events,
persist a record (e.g. insert a `notifications` row) and let the client poll or
read that record on load. Queue consumers (`src/services/queues/*`) already
persist such records for order events.
