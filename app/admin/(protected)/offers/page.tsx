"use client"

import { useEffect, useState, useMemo } from "react"
import { Plus, Pencil, Trash2, Loader2, X, Star, Search } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUploader, type CloudinaryUploadData } from "@/components/admin/image-uploader"
import { ClientImage } from "@/components/ui/client-image"
import { runAfterRender } from "@/components/admin/use-deferred-load"
import { useToast } from "@/components/ui/toast"

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
  is_featured?: boolean
}

type ProductOption = {
  id: string
  name_ar?: string
  price?: number
  image_url?: string
}

const EMPTY_FORM = {
  campaign_name: "",
  banner: "",
  discount_type: "percentage" as Offer["discount_type"],
  value: "",
  buy_x: "",
  get_y: "",
  product_ids: [] as string[],
  start_date: "",
  end_date: "",
  status: "active",
  is_featured: false,
}

export default function AdminOffersPage() {
  const toast = useToast()
  const [offers, setOffers] = useState<Offer[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [cloudinaryData, setCloudinaryData] = useState<CloudinaryUploadData | null>(null)
  const [productSearch, setProductSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setCloudinaryData(null)
    setProductSearch("")
    setError(null)
    // Default dates: now → end of today
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 0, 0)
    setForm({
      ...EMPTY_FORM,
      start_date: formatLocalDateTime(now),
      end_date: formatLocalDateTime(endOfDay),
    })
    setShowForm(true)
  }

  function formatLocalDateTime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function openEdit(offer: Offer) {
    setEditingId(offer.id)
    setCloudinaryData(null)
    setProductSearch("")
    setError(null)
    setForm({
      campaign_name: offer.campaign_name,
      banner: offer.banner ?? "",
      discount_type: offer.discount_type,
      value: offer.value?.toString() ?? "",
      buy_x: offer.buy_x?.toString() ?? "",
      get_y: offer.get_y?.toString() ?? "",
      product_ids: (offer.product_ids ?? []).slice(),
      start_date: offer.start_date.slice(0, 16),
      end_date: offer.end_date.slice(0, 16),
      status: offer.status,
      is_featured: offer.is_featured ?? false,
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
    setError(null)

    if (!form.campaign_name.trim()) {
      setError("اسم العرض مطلوب")
      return
    }
    if (!form.start_date || !form.end_date) {
      setError("تاريخ البداية والنهاية مطلوبان")
      return
    }
    if (form.product_ids.length === 0) {
      setError("اختر منتجاً واحداً على الأقل")
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        campaignName: form.campaign_name.trim(),
        banner: form.banner || undefined,
        discountType: form.discount_type,
        productIds: form.product_ids,
        startDate: new Date(form.start_date).toISOString(),
        endDate: new Date(form.end_date).toISOString(),
        status: form.status,
        isFeatured: form.is_featured,
      }
      if (form.discount_type === "percentage" || form.discount_type === "fixed_price") {
        payload.value = form.value ? Number(form.value) : undefined
      }
      if (form.discount_type === "buy_x_get_y") {
        payload.buyX = form.buy_x ? Number(form.buy_x) : undefined
        payload.getY = form.get_y ? Number(form.get_y) : undefined
      }

      const url = editingId ? `/api/admin/offers/${editingId}` : "/api/admin/offers"
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (body?.success) {
        toast.success(editingId ? "تم تحديث العرض" : "تم إنشاء العرض")
        setShowForm(false)
        await load()
      } else {
        const msg =
          body?.error ??
          (body?.post ? Object.values(body.post).flat().join("، ") : null) ??
          "تعذر حفظ العرض"
        setError(msg)
        toast.error(msg)
      }
    } catch {
      setError("تعذر حفظ العرض — تحقق من الاتصال")
      toast.error("تعذر حفظ العرض")
    } finally {
      setSaving(false)
    }
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      product_ids: f.product_ids.includes(id)
        ? f.product_ids.filter((p) => p !== id)
        : [...f.product_ids, id],
    }))
  }

  function discountLabel(o: Offer): string {
    if (o.discount_type === "percentage" && o.value != null) return `-${o.value}%`
    if (o.discount_type === "fixed_price" && o.value != null) return `خصم ${o.value} ج.م`
    if (o.discount_type === "buy_x_get_y" && o.buy_x && o.get_y)
      return `اشترِ ${o.buy_x} احصل على ${o.get_y}`
    return o.discount_type
  }

  // Filtered products for the picker
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products
    const q = productSearch.trim().toLowerCase()
    return products.filter((p) =>
      (p.name_ar ?? "").toLowerCase().includes(q)
    )
  }, [products, productSearch])

  async function load() {
    setLoading(true)
    try {
      const [offersRes, productsRes] = await Promise.all([
        fetch("/api/admin/offers", { cache: "no-store" }),
        fetch("/api/admin/products", { cache: "no-store" }),
      ])
      const offersBody = await offersRes.json()
      const productsBody = await productsRes.json()
      setOffers(Array.isArray(offersBody?.data) ? offersBody.data : [])
      setProducts(Array.isArray(productsBody?.data) ? productsBody.data : [])
    } catch {
      toast.error("تعذر تحميل البيانات")
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
        description="إدارة العروض والتخفيضات اليومية"
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
            <form onSubmit={handleSubmit} className="grid gap-4">
              {/* Campaign name */}
              <div>
                <Label htmlFor="campaign_name">
                  اسم العرض <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="campaign_name"
                  value={form.campaign_name}
                  onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
                  placeholder="مثال: عرض اليوم - أرز وسكر"
                  required
                />
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="discount_type">نوع الخصم</Label>
                  <select
                    id="discount_type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value as Offer["discount_type"] })}
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed_price">سعر ثابت (خصم بالجنيه)</option>
                    <option value="buy_x_get_y">اشترِ X واحصل على Y</option>
                  </select>
                </div>

                {(form.discount_type === "percentage" || form.discount_type === "fixed_price") && (
                  <div>
                    <Label htmlFor="value">
                      قيمة الخصم <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      placeholder={form.discount_type === "percentage" ? "مثال: 15" : "مثال: 10"}
                      required
                    />
                  </div>
                )}

                {form.discount_type === "buy_x_get_y" && (
                  <>
                    <div>
                      <Label htmlFor="buy_x">اشترِ X</Label>
                      <Input
                        id="buy_x"
                        type="number"
                        min="1"
                        value={form.buy_x}
                        onChange={(e) => setForm({ ...form, buy_x: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="get_y">احصل على Y</Label>
                      <Input
                        id="get_y"
                        type="number"
                        min="1"
                        value={form.get_y}
                        onChange={(e) => setForm({ ...form, get_y: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Product picker */}
              <div>
                <Label>
                  المنتجات المشمولة{" "}
                  <span className="text-primary font-bold">({form.product_ids.length})</span>
                </Label>
                <div className="mt-2 rounded-lg border border-input">
                  {/* Search */}
                  <div className="relative border-b border-input">
                    <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="🔍 ابحث عن منتج..."
                      className="w-full py-2 pr-9 pl-3 text-sm bg-transparent outline-none"
                    />
                  </div>
                  {/* Selected products summary */}
                  {form.product_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 border-b border-input p-2">
                      {form.product_ids.map((id) => {
                        const p = products.find((pr) => pr.id === id)
                        if (!p) return null
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {p.name_ar ?? id}
                            <button
                              type="button"
                              onClick={() => toggleProduct(id)}
                              className="text-primary/60 hover:text-primary"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                  {/* Product list */}
                  <div className="max-h-48 overflow-y-auto p-2">
                    {products.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        لا توجد منتجات بعد. أضف منتجات أولاً.
                      </p>
                    ) : filteredProducts.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        لا توجد نتائج للبحث.
                      </p>
                    ) : (
                      filteredProducts.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.product_ids.includes(p.id)}
                            onChange={() => toggleProduct(p.id)}
                            className="size-4 rounded shrink-0"
                          />
                          {p.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image_url}
                              alt=""
                              className="size-8 rounded object-cover shrink-0"
                            />
                          )}
                          <span className="flex-1 truncate">{p.name_ar ?? p.id}</span>
                          {p.price != null && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {p.price} ج.م
                            </span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="start_date">
                    يبدأ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">
                    ينتهي <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Status + Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="status">الحالة</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">نشط</option>
                    <option value="scheduled">مجدول</option>
                    <option value="inactive">مسودة</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                      className="size-4 rounded"
                    />
                    <Star className="size-4 text-accent" /> عرض مميز (يُظهر في الواجهة)
                  </label>
                </div>
              </div>

              {/* Banner Image Upload */}
              <div>
                <ImageUploader
                  value={form.banner}
                  onChange={(url) => setForm({ ...form, banner: url })}
                  onCloudinaryData={setCloudinaryData}
                  label="صورة البانر (اختياري)"
                />
              </div>

              {/* Error display */}
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  <span className="mr-2">{editingId ? "تحديث" : "نشر العرض"}</span>
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
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            لا توجد عروض حتى الآن. اضغط &quot;عرض جديد&quot; لإنشاء أول عرض.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold">{offer.campaign_name}</h4>
                    {offer.is_featured && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                        <Star className="mr-1 inline size-3" /> مميز
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        offer.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {discountLabel(offer)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        offer.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {offer.status === "active" ? "نشط" : offer.status === "scheduled" ? "مجدول" : offer.status}
                    </span>
                  </div>
                  {offer.product_ids.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {offer.product_ids.length} منتج
                      {offer.productNames.filter(Boolean).length > 0 && (
                        <>: {offer.productNames.filter(Boolean).join("، ")}</>
                      )}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(offer.start_date).toLocaleDateString("ar-EG")} —{" "}
                    {new Date(offer.end_date).toLocaleDateString("ar-EG")}
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
