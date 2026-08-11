"use client"

import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type SeoRow = {
  id: string
  page_key: "homepage" | "category" | "product"
  meta_title_template: string
  meta_description_template: string
  og_image_default?: string | null
}

const LABELS: Record<SeoRow["page_key"], string> = {
  homepage: "الصفحة الرئيسية",
  category: "صفحة القسم",
  product: "صفحة المنتج",
}

export function SeoSettingsPage() {
  const toast = useToast()
  const [rows, setRows] = useState<SeoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/seo", { cache: "no-store" })
      const body = await res.json()
      setRows(Array.isArray(body?.data) ? body.data : [])
    } catch {
      toast.error("تعذر تحميل إعدادات SEO")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return runAfterRender(load)
  }, [])

  function patch(key: SeoRow["page_key"], field: keyof SeoRow, value: string | null) {
    setRows((prev) => prev.map((r) => (r.page_key === key ? { ...r, [field]: value } : r)))
  }

  async function save() {
    setSaving(true)
    try {
      for (const r of rows) {
        await fetch("/api/admin/seo", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageKey: r.page_key,
            metaTitleTemplate: r.meta_title_template,
            metaDescriptionTemplate: r.meta_description_template,
            ogImageDefault: r.og_image_default || null,
          }),
        })
      }
      toast.success("تم حفظ إعدادات SEO")
    } catch {
      toast.error("تعذر حفظ إعدادات SEO")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> جارٍ التحميل…</div>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6">
        <p className="text-sm text-muted-foreground">
          قوالب العنوان والوصف لكل نوع صفحة. استخدم {"{name}"} كمتغير يُستبدل باسم الصفحة أو المنتج.
        </p>
        {rows.map((r) => (
          <div key={r.page_key} className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <p className="text-sm font-black">{LABELS[r.page_key]}</p>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`title-${r.page_key}`}>قالب عنوان Meta</Label>
              <Input id={`title-${r.page_key}`} value={r.meta_title_template} onChange={(e) => patch(r.page_key, "meta_title_template", e.target.value)} dir="ltr" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`desc-${r.page_key}`}>قالب وصف Meta</Label>
              <Textarea id={`desc-${r.page_key}`} value={r.meta_description_template} onChange={(e) => patch(r.page_key, "meta_description_template", e.target.value)} rows={2} dir="ltr" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`og-${r.page_key}`}>صورة OG افتراضية</Label>
              <Input id={`og-${r.page_key}`} value={r.og_image_default ?? ""} onChange={(e) => patch(r.page_key, "og_image_default", e.target.value || null)} dir="ltr" />
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            حفظ
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
