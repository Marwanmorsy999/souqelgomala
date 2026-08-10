"use client"

import { useEffect, useState } from "react"
import { Loader2, Search, Eye, Phone } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { runAfterRender } from "@/components/admin/use-deferred-load"
import { useToast } from "@/components/ui/toast"

type Customer = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  total_orders: number
  total_spent: number
  first_order_at: string | null
  last_order_at: string | null
  created_at: string
}

type OrderItem = {
  id: string
  name_ar: string | null
  quantity: number
  unit_price: number | null
  total: number | null
}

type CustomerOrder = {
  id: string
  order_number: string | null
  status: string
  total: number | null
  created_at: string
  customer_phone: string | null
  customer_address: string | null
  itemsCount?: number
  items?: OrderItem[]
}

type CustomerDetail = {
  customer: {
    id: string
    name: string | null
    phone: string | null
    email: string | null
    total_spending: number | null
    order_count: number | null
    is_vip: boolean
    is_blacklisted: boolean
    notes: string | null
    created_at: string
  }
  orders: CustomerOrder[]
}

const STATUS_LABEL: Record<string, string> = {
  new: "جديد",
  accepted: "مقبول",
  preparing: "قيد التجهيز",
  packed: "تم التغليف",
  out_for_delivery: "في الطريق",
  delivered: "تم التسليم",
  cancelled: "ملغي",
}

export default function AdminCustomersPage() {
  const toast = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const url = search ? `/api/admin/customers?search=${encodeURIComponent(search)}` : "/api/admin/customers"
      const res = await fetch(url, { cache: "no-store" })
      const body = await res.json()
      if (body?.success) {
        setCustomers(body.data ?? [])
      } else {
        toast.error(body?.error ?? "تعذر تحميل العملاء")
      }
    } catch {
      toast.error("تعذر تحميل العملاء")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return runAfterRender(load)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) load()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  async function openDetail(id: string) {
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { cache: "no-store" })
      const body = await res.json()
      if (body?.success && body.data) {
        setDetail(body.data)
      } else {
        toast.error(body?.error ?? "تعذر تحميل تفاصيل العميل")
      }
    } catch {
      toast.error("تعذر تحميل تفاصيل العميل")
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="العملاء" description="إدارة عملاء المتجر وسجل طلباتهم" />

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <Label htmlFor="search">بحث</Label>
            <div className="relative mt-2">
              <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم، الهاتف، أو البريد..."
                className="pr-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span>جارٍ التحميل…</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">لا يوجد عملاء حتى الآن.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3 font-semibold">العميل</th>
                    <th className="p-3 font-semibold">الهاتف</th>
                    <th className="p-3 font-semibold">البريد</th>
                    <th className="p-3 font-semibold">الطلبات</th>
                    <th className="p-3 font-semibold">إجمالي المشتريات</th>
                    <th className="p-3 font-semibold">آخر طلب</th>
                    <th className="p-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b">
                      <td className="p-3 font-bold">{customer.full_name}</td>
                      <td className="p-3" dir="ltr">{customer.phone ?? "—"}</td>
                      <td className="p-3" dir="ltr">{customer.email ?? "—"}</td>
                      <td className="p-3">{customer.total_orders}</td>
                      <td className="p-3 font-bold">{Number(customer.total_spent).toFixed(2)} ج.م</td>
                      <td className="p-3">
                        {customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString("ar-EG") : "—"}
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="icon" onClick={() => openDetail(customer.id)} aria-label="تفاصيل">
                          <Eye className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={(o) => !o && setDetailOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل العميل</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> جارٍ التحميل…
            </div>
          ) : detail ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 rounded-xl bg-muted/40 p-4 text-sm">
                <p className="font-bold">{detail.customer.name ?? "—"}</p>
                <p className="flex items-center gap-2"><Phone className="size-4 text-primary" /> {detail.customer.phone ?? "—"}</p>
                <p className="text-muted-foreground">{detail.customer.email ?? "—"}</p>
                {detail.customer.is_vip && <span className="mt-1 w-fit rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">عميل VIP</span>}
                {detail.customer.is_blacklisted && <span className="mt-1 w-fit rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">محظور</span>}
              </div>

              <div className="text-sm">
                <p className="font-semibold">عدد الطلبات: {detail.orders.length}</p>
                <p className="text-muted-foreground">
                  إجمالي الإنفاق: {Number(detail.customer.total_spending ?? 0).toFixed(2)} ج.م
                </p>
              </div>

              {detail.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد طلبات لهذا العميل.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {detail.orders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold">{order.order_number ?? order.id.slice(0, 8)}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString("ar-EG")}
                      </p>
                      {order.items && order.items.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1 border-t pt-2">
                          {order.items.map((it) => (
                            <div key={it.id} className="flex justify-between text-xs">
                              <span>{it.name_ar ?? it.id}</span>
                              <span className="text-muted-foreground">
                                {it.quantity} × {it.unit_price ?? 0} = {it.total ?? 0} ج.م
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-sm font-bold">
                        الإجمالي: {Number(order.total ?? 0).toFixed(2)} ج.م
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-destructive">تعذر تحميل التفاصيل.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
