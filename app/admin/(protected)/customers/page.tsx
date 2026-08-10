"use client"

import { useEffect, useState } from "react"
import { Users, Loader2, Search } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { runAfterRender } from "@/components/admin/use-deferred-load"

const toast = {
  success: (msg: string) => { console.log(msg); alert(msg) },
  error: (msg: string) => { console.error(msg); alert(msg) }
}

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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="العملاء" description="إدارة عملاء المتجر" />

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
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b">
                      <td className="p-3">{customer.full_name}</td>
                      <td className="p-3" dir="ltr">{customer.phone ?? "—"}</td>
                      <td className="p-3" dir="ltr">{customer.email ?? "—"}</td>
                      <td className="p-3">{customer.total_orders}</td>
                      <td className="p-3 font-bold">{Number(customer.total_spent).toFixed(2)} ج.م</td>
                      <td className="p-3">
                        {customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString("ar-EG") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

