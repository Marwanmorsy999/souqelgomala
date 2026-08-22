"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Package,
  Tag,
  ShoppingCart,
  Loader2,
  Plus,
  Wallet,
  Boxes,
  ReceiptText,
  FileSpreadsheet,
  RefreshCw,
  Truck as TruckIcon,
  BarChart3,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { runAfterRender } from "@/components/admin/use-deferred-load"
import { useToast } from "@/components/ui/toast"

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

type TrendPoint = { date: string; label: string; sales: number; orders: number }

type DashboardData = {
  stats: {
    productsCount: number
    categoriesCount: number
    offersCount: number
    newOrdersCount: number
    totalOrdersCount: number
    activeProductsCount: number
    salesToday: number
    ordersToday: number
  }
  salesTrend: TrendPoint[]
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
  if (s === "new") return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
  return "bg-muted text-foreground"
}

function discountLabel(o: TodaysOffer): string {
  if (o.discount_type === "percentage" && o.value != null) return `-${o.value}%`
  if (o.discount_type === "fixed_price" && o.value != null) return `خصم ${o.value} ج.م`
  if (o.discount_type === "buy_x_get_y" && o.buy_x && o.get_y) return `اشترِ ${o.buy_x} احصل على ${o.get_y}`
  return DISCOUNT_LABELS[o.discount_type] ?? o.discount_type
}

function formatEGP(value: number): string {
  return `${value.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="size-12 shrink-0 animate-pulse rounded-xl bg-muted/60" />
        <div className="flex w-full flex-col gap-2">
          <div className="h-6 w-16 animate-pulse rounded bg-muted/60" />
          <div className="h-3.5 w-24 animate-pulse rounded bg-muted/40" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  const toast = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load(silent = false) {
    if (silent) setRefreshing(true)
    else setLoading(true)
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
      setRefreshing(false)
    }
  }

  useEffect(() => {
    return runAfterRender(() => load())
  }, [])

  /** Export the dashboard snapshot (insights + trend + recent orders) as an Excel-compatible CSV. */
  function exportToExcel() {
    if (!data) return
    try {
      const rows: (string | number)[][] = []
      rows.push(["لوحة الإدارة — سوق الجملة"])
      rows.push(["تاريخ التصدير", new Date().toLocaleString("ar-EG")])
      rows.push([])
      rows.push(["المؤشرات السريعة", "القيمة"])
      rows.push(["مبيعات اليوم", data.stats.salesToday])
      rows.push(["طلبات اليوم", data.stats.ordersToday])
      rows.push(["إجمالي الطلبات", data.stats.totalOrdersCount])
      rows.push(["منتجات نشطة", data.stats.activeProductsCount])
      rows.push(["إجمالي المنتجات", data.stats.productsCount])
      rows.push(["الأقسام", data.stats.categoriesCount])
      rows.push([])
      rows.push(["اتجاه المبيعات — آخر ٧ أيام"])
      rows.push(["التاريخ", "اليوم", "المبيعات", "عدد الطلبات"])
      for (const p of data.salesTrend) rows.push([p.date, p.label, p.sales, p.orders])
      rows.push([])
      rows.push(["آخر الطلبات"])
      rows.push(["رقم الطلب", "العميل", "الهاتف", "الحالة", "الأصناف", "الإجمالي"])
      for (const o of data.recentOrders) {
        rows.push([o.orderNumber, o.customerName ?? "", o.customerPhone ?? "", STATUS_LABELS[o.status] ?? o.status, o.itemsCount, o.total])
      }

      // UTF-8 BOM so Excel opens Arabic correctly.
      const csv =
        "\uFEFF" +
        rows
          .map((row) =>
            row
              .map((cell) => {
                const s = String(cell ?? "")
                return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
              })
              .join(","),
          )
          .join("\r\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("تم تصدير لوحة الإدارة بنجاح")
    } catch {
      toast.error("تعذر تصدير الملف")
    }
  }

  const insightCards = useMemo(
    () => [
      {
        label: "مبيعات اليوم",
        value: formatEGP(data?.stats.salesToday ?? 0),
        sub: `${data?.stats.ordersToday ?? 0} طلب اليوم`,
        icon: Wallet,
        color: "text-green-600 dark:text-green-400",
        href: "/admin/orders",
      },
      {
        label: "إجمالي الطلبات",
        value: String(data?.stats.totalOrdersCount ?? 0),
        sub: `${data?.stats.newOrdersCount ?? 0} طلب جديد`,
        icon: ShoppingCart,
        color: "text-accent",
        href: "/admin/orders",
      },
      {
        label: "منتجات نشطة",
        value: String(data?.stats.activeProductsCount ?? 0),
        sub: `من إجمالي ${data?.stats.productsCount ?? 0} منتج`,
        icon: Boxes,
        color: "text-blue-600 dark:text-blue-400",
        href: "/admin/products",
      },
      {
        label: "عروض نشطة",
        value: String(data?.stats.offersCount ?? 0),
        sub: `${data?.stats.categoriesCount ?? 0} قسم`,
        icon: Tag,
        color: "text-primary",
        href: "/admin/offers",
      },
    ],
    [data],
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Page actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-xl font-black">نظرة عامة</h1>
          <p className="text-sm text-muted-foreground">
            مؤشرات الأداء الحية لسوق الجملة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing} aria-label="تحديث البيانات">
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
          <Button size="sm" onClick={exportToExcel} disabled={!data || loading}>
            <FileSpreadsheet className="size-4" />
            <span>تصدير Excel</span>
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => load()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick insights */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : (
        !error && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {insightCards.map((card) => {
              const Icon = card.icon
              return (
                <Link key={card.label} href={card.href} className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                  <Card className="transition-colors group-hover:border-primary/40 group-hover:bg-muted/20">
                    <CardContent className="flex min-h-[44px] items-center gap-4 p-5">
                      <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/40 ${card.color}`}>
                        <Icon className="size-6" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <p className="truncate text-xl font-black tabular-nums">{card.value}</p>
                        <p className="truncate text-sm text-muted-foreground">{card.label}</p>
                        <p className="truncate text-xs text-muted-foreground/70">{card.sub}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )
      )}

      {!loading && !error && (
        <>
          {/* 7-day sales trend */}
          <Card>
            <CardContent className="p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-lg font-black">اتجاه المبيعات — آخر ٧ أيام</h3>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                  ج.م
                </span>
              </div>
              <div dir="ltr" className="h-64 w-full md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.salesTrend ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary, #16a34a)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-primary, #16a34a)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={54} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                    <Tooltip
                      formatter={(value: unknown, name: unknown) =>
                        name === "sales" ? [formatEGP(Number(value ?? 0)), "المبيعات"] : [String(value ?? 0), "الطلبات"]
                      }
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border, #e5e7eb)", fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="var(--color-primary, #16a34a)" strokeWidth={2.5} fill="url(#salesGradient)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Today's offers */}
          <Card>
            <CardContent className="p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-black">عروض اليوم</h3>
                <Link href="/admin/offers" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  <Plus className="size-4" />
                  عرض الكل
                </Link>
              </div>
              {(data?.todaysOffers.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Tag className="size-10 text-muted-foreground/40" />
                  <div>
                    <p className="font-semibold">لا توجد عروض نشطة.</p>
                    <p className="text-sm text-muted-foreground">أنشئ عرضاً الآن ليظهر للعملاء في الصفحة الرئيسية.</p>
                  </div>
                  <Link href="/admin/offers" className={buttonVariants({ size: "sm", className: "min-h-[44px]" })}>
                    <Plus className="size-4" />
                    إنشاء عرض جديد
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {data?.todaysOffers.map((offer) => (
                    <Link
                      key={offer.id}
                      href="/admin/offers"
                      className="flex items-center justify-between rounded-xl border border-border p-3 text-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-foreground">{offer.campaign_name}</span>
                        <span
                          className={`mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            offer.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {discountLabel(offer)}
                        </span>
                        {offer.productNames.length > 0 && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {offer.productNames.filter(Boolean).join("، ")}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent orders */}
          <Card>
            <CardContent className="p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-black">
                  <ReceiptText className="size-5 text-muted-foreground" />
                  آخر الطلبات
                </h3>
                <Link href="/admin/orders" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  كل الطلبات
                </Link>
              </div>
              {(data?.recentOrders.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <ShoppingCart className="size-10 text-muted-foreground/40" />
                  <div>
                    <p className="font-semibold">لا توجد طلبات حتى الآن.</p>
                    <p className="text-sm text-muted-foreground">سيظهر الطلبات الجديدة هنا فور وصولها من العملاء.</p>
                  </div>
                  <Link href="/admin/orders" className={buttonVariants({ size: "sm", className: "min-h-[44px]" })}>
                    <Plus className="size-4" />
                    إنشاء طلب يدوي
                  </Link>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-right text-sm">
                      <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                        <tr>
                          <th className="rounded-r-lg p-3 font-semibold">#</th>
                          <th className="p-3 font-semibold">العميل</th>
                          <th className="p-3 font-semibold">الهاتف</th>
                          <th className="p-3 font-semibold">الحالة</th>
                          <th className="p-3 font-semibold">الأصناف</th>
                          <th className="rounded-l-lg p-3 font-semibold">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.recentOrders.map((order) => (
                          <tr key={order.id} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                            <td className="p-3 font-mono text-xs">{order.orderNumber}</td>
                            <td className="p-3">{order.customerName ?? "—"}</td>
                            <td className="p-3" dir="ltr">{order.customerPhone ?? "—"}</td>
                            <td className="p-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(order.status)}`}>
                                {STATUS_LABELS[order.status] ?? order.status}
                              </span>
                            </td>
                            <td className="p-3">{order.itemsCount}</td>
                            <td className="p-3 font-bold">{formatEGP(order.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile card view */}
                  <ul className="flex flex-col gap-3 lg:hidden">
                    {data?.recentOrders.map((order) => (
                      <li key={order.id}>
                        <Link
                          href="/admin/orders"
                          className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5 transition-colors hover:bg-muted/30 active:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(order.status)}`}>
                                {STATUS_LABELS[order.status] ?? order.status}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-sm font-bold">{order.customerName ?? "عميل"}</p>
                            <p className="text-xs text-muted-foreground">{order.itemsCount} أصناف</p>
                          </div>
                          <span className="shrink-0 text-sm font-black text-primary">{formatEGP(order.total)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground" role="status">
          <Loader2 className="size-5 animate-spin" />
          <span>جارٍ التحميل…</span>
        </div>
      )}

      {/* Quick links to modules */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { href: "/admin/products/import", icon: Package, label: "استيراد منتجات" },
            { href: "/admin/delivery/drivers", icon: TruckIcon, label: "المناديب" },
            { href: "/admin/reports", icon: BarChart3, label: "التقارير" },
          ].map((q) => {
            const Icon = q.icon
            return (
              <Link key={q.href} href={q.href}>
                <Button variant="outline" className="h-auto w-full flex-col gap-1.5 py-4">
                  <Icon className="size-5 text-primary" />
                  <span className="text-xs font-semibold">{q.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
