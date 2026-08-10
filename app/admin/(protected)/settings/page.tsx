"use client"

import { useEffect, useState } from "react"
import { Settings, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { runAfterRender } from "@/components/admin/use-deferred-load"

const toast = {
  success: (msg: string) => { console.log(msg); alert(msg) },
  error: (msg: string) => { console.error(msg); alert(msg) }
}

type SiteSettings = {
  name: string
  nameEn: string
  tagline: string
  description: string
  location: string
  addressLines: string[]
  phoneMain: string
  phoneAlt: string
  whatsapp: string
  social: { facebook: string; instagram: string; tiktok: string }
  hero: { image?: string; title?: string; description?: string }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState("business")

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" })
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

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span>جارٍ التحميل…</span>
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
    <div className="flex flex-col gap-6">
      <PageHeader title="الإعدادات" description="إعدادات المتجر" />

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 border-b">
          <button onClick={() => setTab("business")} className={`px-4 py-2 ${tab === "business" ? "border-b-2 border-primary font-bold" : ""}`}>معلومات العمل</button>
          <button onClick={() => setTab("contact")} className={`px-4 py-2 ${tab === "contact" ? "border-b-2 border-primary font-bold" : ""}`}>بيانات الاتصال</button>
          <button onClick={() => setTab("social")} className={`px-4 py-2 ${tab === "social" ? "border-b-2 border-primary font-bold" : ""}`}>حسابات التواصل</button>
        </div>

        {tab === "business" && (
          <Card>
            <CardContent className="grid gap-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">اسم المتجر</Label>
                  <Input id="name" value={settings.name} onChange={(e) => update("name", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="nameEn">اسم المتجر (EN)</Label>
                  <Input id="nameEn" value={settings.nameEn} onChange={(e) => update("nameEn", e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="tagline">الشعار</Label>
                <Input id="tagline" value={settings.tagline} onChange={(e) => update("tagline", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="description">وصف المتجر</Label>
                <Textarea id="description" value={settings.description} onChange={(e) => update("description", e.target.value)} rows={3} />
              </div>
              <div>
                <Label htmlFor="location">الموقع</Label>
                <Input id="location" value={settings.location} onChange={(e) => update("location", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "contact" && (
          <Card>
            <CardContent className="grid gap-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phoneMain">الهاتف الرئيسي</Label>
                  <Input id="phoneMain" value={settings.phoneMain} onChange={(e) => update("phoneMain", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phoneAlt">هاتف بديل</Label>
                  <Input id="phoneAlt" value={settings.phoneAlt} onChange={(e) => update("phoneAlt", e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="whatsapp">واتساب</Label>
                <Input id="whatsapp" value={settings.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "social" && (
          <Card>
            <CardContent className="grid gap-4 p-6">
              <div>
                <Label htmlFor="facebook">فيسبوك</Label>
                <Input id="facebook" value={settings.social.facebook} onChange={(e) => update("social", { ...settings.social, facebook: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="instagram">انستغرام</Label>
                <Input id="instagram" value={settings.social.instagram} onChange={(e) => update("social", { ...settings.social, instagram: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="tiktok">تيك توك</Label>
                <Input id="tiktok" value={settings.social.tiktok} onChange={(e) => update("social", { ...settings.social, tiktok: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "social" && (
          <Card>
            <CardContent className="grid gap-4 p-6">
              <div>
                <Label htmlFor="facebook">فيسبوك</Label>
                <Input id="facebook" value={settings.social.facebook} onChange={(e) => update("social", { ...settings.social, facebook: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="instagram">انستغرام</Label>
                <Input id="instagram" value={settings.social.instagram} onChange={(e) => update("social", { ...settings.social, instagram: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="tiktok">تيك توك</Label>
                <Input id="tiktok" value={settings.social.tiktok} onChange={(e) => update("social", { ...settings.social, tiktok: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
