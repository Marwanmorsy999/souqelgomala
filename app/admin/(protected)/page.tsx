"use client"

import { useEffect, useState } from "react"
import { Package, FolderTree, Tag, ShoppingCart, Loader2, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type OrderStatus = "new" | "accepted" | "preparing" | "packed" | "out_for_delivery" | "delivered" | "cancelled"

type RecentOrder = {
  id: string
  orderNumber: string
  customerName: string | null
  customerPhone: string | null
  status: OrderStatus
  total: number
  createdAt: string
  itemsCount: number
}

type TodaysOffer = {
  id: string
  campaign_name: string
  banner?: string | null
  discount_type: "percentage" | "fixed_price" | "buy_x_get_y"
  value?: number | null
  buy_x?: number | null
  get_y?: number | null
  product_ids: string[]
  productCount: number
  productNames: (string | null)[]
  start_date: string
  end_date: string
  status: string
  created_at: string
}

type DashboardData = {
  stats: {
    productsCount: number
    categoriesCount: number
    offersCount: number
    newOrdersCount: number
  }
  recentOrders: RecentOrder[]
  todaysOffers: TodaysOffer[]
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "جديد",
  accepted: "مقبول",
  preparing: "قيد التجهيز",
  packed: "تم التغليف",
  out_for_delivery: "في الطريق",
  delivered: "تم التسليم",
  cancelled: "ملغي",
}

const DISCOUNT_LABELS: Record<string, string> = {
  percentage: "نسبة مئوية",
  fixed_price: "سعر ثابت",
  buy_x_get_y: "اشترِ X واحصل على Y",
}

function statusClass(s: OrderStatus): string {
  if (s === "delivered") return "bg-primary/10 text-primary"
  if (s === "cancelled") return "bg-destructive/10 text-destructive"
  if (s === "new") return "bg-yellow-100 text-yellow-800"
  return "bg-muted text-foreground"
}

function discountLabel(o: TodaysOffer): string {
  if (o.discount_type === "percentage" && o.value != null) return `-${o.value}%`
  if (o.discount_type === "fixed_price" && o.value != null) return `خصم ${o.value} ج.م`
  if (o.discount_type === "buy_x_get_y" && o.buy_x && o.get_y) return `اشترِ ${o.buy_x} احصل على ${o.get_y}`
  return DISCOUNT_LABELS[o.discount_type] ?? o.discount_type
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" })
      const body = await res.json()
      if (body?.success && body.data) {
        setData(body.data)
      } else {
        setError(body?.error ?? "تعذر تحميل لوحة التحكم")
      }
    } catch {
      setError("تعذر تحميل لوحة التحكم")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return runAfterRender(load)
  }, [])

  const statCards = [
    { label: "طلب جديد", value: data?.stats.newOrdersCount ?? 0, icon: ShoppingCart, color: "text-accent" },
    { label: "عروض نشطة", value: data?.stats.offersCount ?? 0, icon: Tag, color: "text-primary" },
    { label: "منتجات", value: data?.stats.productsCount ?? 0, icon: Package, color: "text-blue-600" },
    { label: "أقسام", value: data?.stats.categoriesCount ?? 0, icon: FolderTree, color: "text-green-600" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/40 ${card.color}`}>
                  <Icon className="size-6" />
                </div>
                <div className="flex flex-col">
                  <p className="text-2xl font-black">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>جارٍ التحميل…</span>
        </div>
      )}

      {!loading && !error && (
        <>
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-black">عروض اليوم</h3>
              {data?.todaysOffers.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد عروض نشطة اليوم.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data?.todaysOffers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                      <div className="flex-1">
                        <span className="font-bold text-foreground">{offer.campaign_name}</span>
                        <span
                          className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${offer.status === "active" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}
                        >
                          {discountLabel(offer)}
                        </span>
                        {offer.productNames.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {offer.productNames.filter(Boolean).join("، ")}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="size-4 shrink-0 text-muted-foreground/50" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-black">آخر الطلبات</h3>
              {data?.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد طلبات حتى الآن.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="p-3 font-semibold">#</th>
                        <th className="p-3 font-semibold">العميل</th>
                        <th className="p-3 font-semibold">الهاتف</th>
                        <th className="p-3 font-semibold">الحالة</th>
                        <th className="p-3 font-semibold">الأصناف</th>
                        <th className="p-3 font-semibold">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.recentOrders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="p-3 font-mono text-xs">{order.orderNumber}</td>
                          <td className="p-3">{order.customerName ?? "—"}</td>
                          <td className="p-3" dir="ltr">
                            {order.customerPhone ?? "—"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(order.status)}`}
                            >
                              {STATUS_LABELS[order.status] ?? order.status}
                            </span>
                          </td>
                          <td className="p-3">{order.itemsCount}</td>
                          <td className="p-3 font-bold">{order.total} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
