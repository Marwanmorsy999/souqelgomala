"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type Offer = {
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
}

const toast = {
  success: (msg: string) => { console.log(msg); alert(msg) },
  error: (msg: string) => { console.error(msg); alert(msg) }
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    campaign_name: "",
    banner: "",
    discount_type: "percentage" as Offer["discount_type"],
    value: "",
    buy_x: "",
    get_y: "",
    product_ids: "",
    start_date: "",
    end_date: "",
    status: "active",
  })

  function openCreate() {
    setEditingId(null)
    setForm({
      campaign_name: "",
      banner: "",
      discount_type: "percentage",
      value: "",
      buy_x: "",
      get_y: "",
      product_ids: "",
      start_date: "",
      end_date: "",
      status: "active",
    })
    setShowForm(true)
  }

  function openEdit(offer: Offer) {
    setEditingId(offer.id)
    setForm({
      campaign_name: offer.campaign_name,
      banner: offer.banner ?? "",
      discount_type: offer.discount_type,
      value: offer.value?.toString() ?? "",
      buy_x: offer.buy_x?.toString() ?? "",
      get_y: offer.get_y?.toString() ?? "",
      product_ids: (offer.product_ids ?? []).join(", "),
      start_date: offer.start_date.slice(0, 16),
      end_date: offer.end_date.slice(0, 16),
      status: offer.status,
    })
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا العرض؟")) return
    try {
      const res = await fetch(`/api/admin/offers/${id}`, { method: "DELETE" })
      const body = await res.json()
      if (body?.success) {
        toast.success("تم حذف العرض")
        await load()
      } else {
        toast.error(body?.error ?? "تعذر حذف العرض")
      }
    } catch {
      toast.error("تعذر حذف العرض")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        campaign_name: form.campaign_name,
        banner: form.banner || undefined,
        discount_type: form.discount_type,
        product_ids: form.product_ids.split(",").map((s) => s.trim()).filter(Boolean),
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        status: form.status,
      }
      if (form.discount_type === "percentage" || form.discount_type === "fixed_price") {
        payload.value = form.value ? Number(form.value) : undefined
      }
      if (form.discount_type === "buy_x_get_y") {
        payload.buy_x = form.buy_x ? Number(form.buy_x) : undefined
        payload.get_y = form.get_y ? Number(form.get_y) : undefined
      }

      const url = editingId ? `/api/admin/offers/${editingId}` : "/api/admin/offers"
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (body?.success) {
        toast.success(editingId ? "تم تحديث العرض" : "تم إنشاء العرض")
        setShowForm(false)
        await load()
      } else {
        toast.error(body?.error ?? "تعذر حفظ العرض")
      }
    } catch {
      toast.error("تعذر حفظ العرض")
    } finally {
      setSaving(false)
    }
  }

  function discountLabel(o: Offer): string {
    if (o.discount_type === "percentage" && o.value != null) return `-${o.value}%`
    if (o.discount_type === "fixed_price" && o.value != null) return `خصم ${o.value} ج.م`
    if (o.discount_type === "buy_x_get_y" && o.buy_x && o.get_y)
      return `اشترِ ${o.buy_x} احصل على ${o.get_y}`
    return o.discount_type
  }

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/offers", { cache: "no-store" })
      const body = await res.json()
      if (body?.success) setOffers(body.data ?? [])
      else toast.error(body?.error ?? "تعذر تحميل العروض")
    } catch {
      toast.error("تعذر تحميل العروض")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return runAfterRender(load)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="العروض"
        description="إدارة العروض والتخفيضات"
        actions={
          <Button onClick={openCreate} disabled={showForm}>
            <Plus className="size-4" />
            <span className="mr-2">عرض جديد</span>
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black">{editingId ? "تعديل العرض" : "عرض جديد"}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="campaign_name">اسم الحملة *</Label>
                <Input
                  id="campaign_name"
                  value={form.campaign_name}
                  onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="discount_type">نوع الخصم *</Label>
                <select
                  id="discount_type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value as Offer["discount_type"] })}
                >
                  <option value="percentage">نسبة مئوية</option>
                  <option value="fixed_price">سعر ثابت</option>
                  <option value="buy_x_get_y">اشترِ X واحصل على Y</option>
                </select>
              </div>

              {(form.discount_type === "percentage" || form.discount_type === "fixed_price") && (
                <div>
                  <Label htmlFor="value">القيمة *</Label>
                  <Input
                    id="value"
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    required
                  />
                </div>
              )}

              {form.discount_type === "buy_x_get_y" && (
                <>
                  <div>
                    <Label htmlFor="buy_x">اشترِ X *</Label>
                    <Input
                      id="buy_x"
                      type="number"
                      value={form.buy_x}
                      onChange={(e) => setForm({ ...form, buy_x: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="get_y">احصل على Y *</Label>
                    <Input
                      id="get_y"
                      type="number"
                      value={form.get_y}
                      onChange={(e) => setForm({ ...form, get_y: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <Label htmlFor="product_ids">معرّفات المنتجات (مفصولة بفاصلة)</Label>
                <Input
                  id="product_ids"
                  value={form.product_ids}
                  onChange={(e) => setForm({ ...form, product_ids: e.target.value })}
                  placeholder="uuid1, uuid2, uuid3"
                />
              </div>

              <div>
                <Label htmlFor="start_date">تاريخ البدء *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end_date">تاريخ الانتهاء *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">الحالة *</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">نشط</option>
                  <option value="draft">مسودة</option>
                  <option value="expired">منتهي</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="banner">رابط الصورة</Label>
                <Input
                  id="banner"
                  value={form.banner}
                  onChange={(e) => setForm({ ...form, banner: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  <span className="mr-2">{editingId ? "تحديث" : "إنشاء"}</span>
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>جارٍ التحميل…</span>
        </div>
      ) : offers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">لا توجد عروض حتى الآن.</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold">{offer.campaign_name}</h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        offer.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {discountLabel(offer)}
                    </span>
                  </div>
                  {offer.product_ids.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {offer.product_ids.length} منتج
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(offer.start_date).toLocaleString("ar-EG")} —{" "}
                    {new Date(offer.end_date).toLocaleString("ar-EG")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(offer)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(offer.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
