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

type GeneralSettings = {
  id: string
  business_name: string
  logo_url: string | null
  phone_primary: string | null
  phone_secondary: string | null
  address: string | null
  whatsapp_number: string | null
  facebook_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  min_order_value: number
  free_delivery_threshold: number
  default_delivery_fee: number
}

export function GeneralSettingsPage() {
  const toast = useToast()
  const [settings, setSettings] = useState<GeneralSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings/site", { cache: "no-store" })
      const body = await res.json()
      if (body?.success) setSettings(body.data)
      else toast.error(body?.error ?? "تعذر تحميل الإعدادات")
    } catch {
      toast.error("تعذر تحميل الإعدادات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return runAfterRender(load)
  }, [])

  function set<K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const body = await res.json()
      if (body?.success) {
        setSettings(body.data)
        toast.success("تم حفظ إعدادات المتجر")
      } else {
        toast.error(body?.error ?? "تعذر الحفظ")
      }
    } catch {
      toast.error("تعذر حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> جارٍ التحميل…
      </div>
    )
  }
  if (!settings) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-destructive">تعذر تحميل الإعدادات</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="business_name">اسم المتجر</Label>
            <Input id="business_name" value={settings.business_name} onChange={(e) => set("business_name", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="logo_url">رابط الشعار (Logo)</Label>
            <Input id="logo_url" value={settings.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value || null)} dir="ltr" />
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="logo" className="size-12 rounded-lg object-contain" />
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="phone_primary">الهاتف الرئيسي</Label>
            <Input id="phone_primary" value={settings.phone_primary ?? ""} onChange={(e) => set("phone_primary", e.target.value || null)} dir="ltr" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="phone_secondary">هاتف بديل</Label>
            <Input id="phone_secondary" value={settings.phone_secondary ?? ""} onChange={(e) => set("phone_secondary", e.target.value || null)} dir="ltr" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="address">العنوان</Label>
          <Textarea id="address" value={settings.address ?? ""} onChange={(e) => set("address", e.target.value || null)} rows={2} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="whatsapp_number">رقم واتساب</Label>
          <Input id="whatsapp_number" value={settings.whatsapp_number ?? ""} onChange={(e) => set("whatsapp_number", e.target.value || null)} dir="ltr" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="facebook_url">فيسبوك</Label>
            <Input id="facebook_url" value={settings.facebook_url ?? ""} onChange={(e) => set("facebook_url", e.target.value || null)} dir="ltr" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="instagram_url">انستجرام</Label>
            <Input id="instagram_url" value={settings.instagram_url ?? ""} onChange={(e) => set("instagram_url", e.target.value || null)} dir="ltr" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="tiktok_url">تيك توك</Label>
            <Input id="tiktok_url" value={settings.tiktok_url ?? ""} onChange={(e) => set("tiktok_url", e.target.value || null)} dir="ltr" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="min_order_value">الحد الأدنى للطلب</Label>
            <Input id="min_order_value" type="number" value={settings.min_order_value} onChange={(e) => set("min_order_value", Number(e.target.value) || 0)} dir="ltr" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="free_delivery_threshold">حد التوصيل المجاني</Label>
            <Input id="free_delivery_threshold" type="number" value={settings.free_delivery_threshold} onChange={(e) => set("free_delivery_threshold", Number(e.target.value) || 0)} dir="ltr" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="default_delivery_fee">رسوم التوصيل الافتراضية</Label>
            <Input id="default_delivery_fee" type="number" value={settings.default_delivery_fee} onChange={(e) => set("default_delivery_fee", Number(e.target.value) || 0)} dir="ltr" />
          </div>
        </div>

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
