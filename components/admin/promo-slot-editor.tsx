"use client"

import { useEffect, useMemo, useState } from "react"
import { ImagePlus, Loader2, Save, Trash2, Eye, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// Switch not available; using native checkbox fallback
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type PromoRow = {
  id: string
  placement: string
  category_id?: string | null
  image_url: string
  title: string
  subtitle?: string | null
  cta_text?: string | null
  cta_link?: string | null
  start_at: string
  end_at: string
  active: boolean
  sort_order: number
  publish_status?: string
  frequency?: string
}

type Props = { placement: string; title: string }

export function PromoSlotEditor({ placement, title }: Props) {
  const toast = useToast()
  const [rows, setRows] = useState<PromoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PromoRow | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [titleText, setTitleText] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [ctaText, setCtaText] = useState("")
  const [ctaLink, setCtaLink] = useState("")
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [active, setActive] = useState(true)
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("published")
  const [frequency, setFrequency] = useState("every_visit")
  const [categoryId, setCategoryId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/promos?placement=${encodeURIComponent(placement)}`, { cache: "no-store" })
      const data = await res.json()
      setRows(Array.isArray(data?.data) ? data.data : [])
    } catch { toast.error("تعذر تحميل البانرات") }
    finally { setLoading(false) }
  }
  useEffect(() => { return runAfterRender(load) }, [placement])

  function openCreate() {
    setEditing(null); setImageUrl(""); setTitleText(""); setSubtitle(""); setCtaText(""); setCtaLink(""); setStartAt(""); setEndAt(""); setActive(true); setPublishStatus("published"); setFrequency("every_visit"); setCategoryId(null); setOpen(true)
  }
  function openEdit(row: PromoRow) {
    setEditing(row); setImageUrl(row.image_url); setTitleText(row.title); setSubtitle(row.subtitle ?? ""); setCtaText(row.cta_text ?? ""); setCtaLink(row.cta_link ?? ""); setStartAt(row.start_at.slice(0,16)); setEndAt(row.end_at.slice(0,16)); setActive(row.active); setPublishStatus((row.publish_status as "draft" | "published") ?? "published"); setFrequency(row.frequency ?? "every_visit"); setCategoryId(row.category_id ?? null); setOpen(true)
  }

  async function save() {
    if (!titleText.trim() || !imageUrl.trim() || !startAt || !endAt) { toast.error("أكمل الحقول المطلوبة"); return }
    setSaving(true)
    try {
      const payload = { placement, categoryId, imageUrl: imageUrl.trim(), title: titleText.trim(), subtitle: subtitle.trim() || undefined, ctaText: ctaText.trim() || undefined, ctaLink: ctaLink.trim() || undefined, startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString(), active, sortOrder: 0, publishStatus, frequency }
      const url = editing ? `/api/admin/promos/${editing.id}` : "/api/admin/promos"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "فشل الحفظ")
      toast.success(editing ? "تم تحديث البانر" : "تم إنشاء البانر")
      setOpen(false)
      await load()
    } catch (e) { toast.error((e as Error).message) }
    finally { setSaving(false) }
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا البانر؟")) return
    const res = await fetch(`/api/admin/promos/${id}`, { method: "DELETE" })
    if (!res.ok) { const data = await res.json().catch(() => ({})); toast.error(data?.error || "تعذر الحذف"); return }
    toast.success("تم حذف البانر")
    await load()
  }

  const activePublished = useMemo(() => rows.find((r) => r.active && (r.publish_status ?? "published") === "published"), [rows])

  return (
    <Card className="bg-bg-surface border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        <Button size="sm" onClick={openCreate} className="gap-1.5"><Plus className="size-4" /> إضافة</Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (<div className="flex h-32 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>) : rows.length === 0 ? (<p className="text-sm text-muted-foreground">لا توجد شرائح بعد</p>) : (
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <img src={row.image_url} alt={row.title} className="size-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{(row.publish_status ?? "published") === "draft" ? "مسودة" : "منشور"} • {row.active ? "نشط" : "متوقف"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Eye className="size-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(row.id)} className="text-destructive"><Trash2 className="size-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activePublished && (
          <div className="mt-2">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">معاينة مباشرة</p>
            <div className="relative overflow-hidden rounded-xl border border-border bg-bg-surface">
              <img src={activePublished.image_url} alt={activePublished.title} className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="relative p-6">
                <h3 className="text-lg font-black text-white">{activePublished.title}</h3>
                {activePublished.subtitle && <p className="mt-1 text-sm text-white/80">{activePublished.subtitle}</p>}
                {activePublished.cta_text && (<span className="mt-3 inline-block rounded-lg bg-brand-green px-4 py-2 text-sm font-bold text-white">{activePublished.cta_text}</span>)}
              </div>
            </div>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "تعديل البانر" : "بانر جديد"}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1"><Label>رابط الصورة</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} dir="ltr" /></div>
              <div className="flex flex-col gap-1"><Label>العنوان</Label><Input value={titleText} onChange={(e) => setTitleText(e.target.value)} /></div>
              <div className="flex flex-col gap-1"><Label>النص الفرعي</Label><Textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2} /></div>
              <div className="flex flex-col gap-1"><Label>نص CTA</Label><Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} /></div>
              <div className="flex flex-col gap-1"><Label>رابط CTA</Label><Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} dir="ltr" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1"><Label>بداية</Label><Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} /></div>
                <div className="flex flex-col gap-1"><Label>نهاية</Label><Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} /></div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 rounded" /><label className="text-sm">نشط</label></div>
                <div className="flex items-center gap-2">
                  <Label>الحالة:</Label>
                  <select value={publishStatus} onChange={(e) => setPublishStatus(e.target.value as "draft" | "published")} className="h-9 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="draft">مسودة</option>
                    <option value="published">منشور</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="gap-1.5"><X className="size-4" /> إلغاء</Button>
              <Button onClick={save} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="size-4 animate-spin" />}
                <Save className="size-4" /> حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
