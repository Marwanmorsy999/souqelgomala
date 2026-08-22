"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, Eye, Store } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/feedback/skeleton"
import { runAfterRender } from "@/components/admin/use-deferred-load"
import { useToast } from "@/components/ui/toast"

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
  hero: { image?: string; title?: string; description?: string; ctaLabel?: string; whatsappCtaLabel?: string; alt?: string }
  ops: {
    maintenanceMode: boolean
    ordersEnabled: boolean
    taxEnabled: boolean
    taxRate: number
  }
}

type TabKey = "business" | "contact" | "social" | "ops"

const TABS: { key: TabKey; label: string }[] = [
  { key: "business", label: "معلومات العمل" },
  { key: "contact", label: "بيانات الاتصال" },
  { key: "social", label: "حسابات التواصل" },
  { key: "ops", label: "التشغيل" },
]

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
      <div className="min-w-0">
        <p className="font-bold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
          checked ? "bg-green-600" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`inline-block size-6 transform rounded-full bg-white shadow transition-transform ${
            checked ? "-translate-x-[24px]" : "-translate-x-0.5"
          }`}
        />
      </button>
    </div>
  )
}

export default function AdminSettingsPage() {
  const toast = useToast()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<TabKey>("business")

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const body = await res.json()
      if (body?.success) {
        setSettings(body.data)
        toast.success("تم حفظ الإعدادات")
      } else {
        toast.error(body?.error ?? "تعذر حفظ الإعدادات")
      }
    } catch {
      toast.error("تعذر حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  /**
   * Immediate persistence for operational switches — flips global state and
   * pushes to the server right away so the storefront reflects the change on
   * its next read (KV cache invalidated server-side).
   */
  async function saveOps(patch: Partial<SiteSettings["ops"]>, changedKey: string) {
    if (!settings) return
    const optimistic = { ...settings, ops: { ...settings.ops, ...patch } }
    setSettings(optimistic)
    setSavingKeys((prev) => new Set(prev).add(changedKey))
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimistic),
      })
      const body = await res.json()
      if (body?.success) {
        setSettings(body.data)
        toast.success("تم تحديث إعداد التشغيل فوراً")
      } else {
        throw new Error(body?.error ?? "تعذر حفظ الإعداد")
      }
    } catch (err) {
      // Roll back to the previous value on failure.
      setSettings(settings)
      toast.error((err as Error).message || "تعذر حفظ الإعداد")
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        next.delete(changedKey)
        return next
      })
    }
  }

  const phoneValid = !settings?.phoneMain.trim() || /^\+?[\d\s-]{8,16}$/.test(settings.phoneMain.trim())
  const whatsappValid = !settings?.whatsapp.trim() || /^\d{10,15}$/.test(settings.whatsapp.replace(/\D/g, ""))
  const nameValid = Boolean(settings?.name.trim())

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm font-semibold text-destructive">تعذر تحميل الإعدادات</p>
          <Button variant="outline" size="sm" onClick={load}>
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الإعدادات"
        description="إعدادات المتجر (تُحفظ في قاعدة البيانات وتظهر في المتجر)"
        actions={
          <Button onClick={save} disabled={saving} className="min-h-[44px]">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span className="mr-2">حفظ</span>
          </Button>
        }
      />

      {/* Tabs */}
      <div className="-mx-1 flex gap-1 overflow-x-auto border-b px-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === t.key ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Main panel */}
        <div className="flex flex-col gap-4">
          {tab === "business" && (
            <Card>
              <CardContent className="grid gap-4 p-5 md:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">اسم المتجر</Label>
                    <Input id="name" value={settings.name} onChange={(e) => update("name", e.target.value)} className="min-h-[44px]" />
                    {!nameValid && <p className="mt-1 text-xs text-destructive">اسم المتجر مطلوب</p>}
                  </div>
                  <div>
                    <Label htmlFor="nameEn">اسم المتجر (EN)</Label>
                    <Input id="nameEn" dir="ltr" value={settings.nameEn} onChange={(e) => update("nameEn", e.target.value)} className="min-h-[44px]" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tagline">الشعار</Label>
                  <Input id="tagline" value={settings.tagline} onChange={(e) => update("tagline", e.target.value)} className="min-h-[44px]" />
                </div>
                <div>
                  <Label htmlFor="description">وصف المتجر</Label>
                  <Textarea id="description" value={settings.description} onChange={(e) => update("description", e.target.value)} rows={3} />
                </div>
                <div>
                  <Label htmlFor="location">الموقع</Label>
                  <Input id="location" value={settings.location} onChange={(e) => update("location", e.target.value)} className="min-h-[44px]" />
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "contact" && (
            <Card>
              <CardContent className="grid gap-4 p-5 md:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="phoneMain">الهاتف الرئيسي</Label>
                    <Input id="phoneMain" dir="ltr" type="tel" inputMode="tel" value={settings.phoneMain} onChange={(e) => update("phoneMain", e.target.value)} className="min-h-[44px]" />
                    {!phoneValid && <p className="mt-1 text-xs text-destructive">رقم هاتف غير صالح</p>}
                  </div>
                  <div>
                    <Label htmlFor="phoneAlt">هاتف بديل</Label>
                    <Input id="phoneAlt" dir="ltr" type="tel" inputMode="tel" value={settings.phoneAlt} onChange={(e) => update("phoneAlt", e.target.value)} className="min-h-[44px]" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="whatsapp">واتساب (بصيغة دولية بدون +)</Label>
                  <Input id="whatsapp" dir="ltr" inputMode="numeric" value={settings.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className="min-h-[44px]" placeholder="201xxxxxxxxx" />
                  {!whatsappValid && <p className="mt-1 text-xs text-destructive">أدخل الرقم بصيغة دولية صحيحة (١٠-١٥ رقم)</p>}
                </div>
                <div>
                  <Label>عناوين الفرع / الموقع (سطر لكل عنوان)</Label>
                  <Textarea
                    value={settings.addressLines.join("\n")}
                    onChange={(e) => update("addressLines", e.target.value.split("\n").filter((l) => l.trim()))}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "social" && (
            <Card>
              <CardContent className="grid gap-4 p-5 md:p-6">
                {(
                  [
                    ["facebook", "فيسبوك"],
                    ["instagram", "انستغرام"],
                    ["tiktok", "تيك توك"],
                  ] as const
                ).map(([key, label]) => {
                  const url = settings.social[key]
                  const validUrl = !url.trim() || /^https?:\/\/.+/.test(url.trim())
                  return (
                    <div key={key}>
                      <Label htmlFor={`social-${key}`}>{label}</Label>
                      <Input
                        id={`social-${key}`}
                        dir="ltr"
                        type="url"
                        value={url}
                        onChange={(e) => update("social", { ...settings.social, [key]: e.target.value })}
                        className="min-h-[44px]"
                        placeholder="https://…"
                      />
                      {!validUrl && <p className="mt-1 text-xs text-destructive">الرابط يجب أن يبدأ بـ http أو https</p>}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {tab === "ops" && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-5 md:p-6">
                <p className="mb-1 text-sm text-muted-foreground">
                  كل مفتاح يُحفظ فوراً عند التغيير ويؤثر على المتجر مباشرة.
                </p>

                <Toggle
                  checked={settings.ops.maintenanceMode}
                  onChange={(next) => saveOps({ maintenanceMode: next }, "maintenanceMode")}
                  label="وضع الصيانة"
                  description="عرض شاشة صيانة للزوار مع إظهار بيانات التواصل فقط."
                  disabled={savingKeys.has("maintenanceMode")}
                />

                <Toggle
                  checked={settings.ops.ordersEnabled}
                  onChange={(next) => saveOps({ ordersEnabled: next }, "ordersEnabled")}
                  label="استقبال الطلبات"
                  description="إيقافه يمنع العملاء من إنشاء طلبات جديدة مؤقتاً."
                  disabled={savingKeys.has("ordersEnabled")}
                />

                <Toggle
                  checked={settings.ops.taxEnabled}
                  onChange={(next) => saveOps({ taxEnabled: next }, "taxEnabled")}
                  label="تفعيل الضريبة"
                  description="إضافة نسبة ضريبة على إجماليات الطلبات."
                  disabled={savingKeys.has("taxEnabled")}
                />

                <div className={`rounded-xl border border-border p-4 ${!settings.ops.taxEnabled && "opacity-60"}`}>
                  <Label htmlFor="tax-rate">نسبة الضريبة (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    inputMode="decimal"
                    value={settings.ops.taxRate}
                    onChange={(e) =>
                      update("ops", {
                        ...settings.ops,
                        taxRate: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      })
                    }
                    className="mt-1 min-h-[44px]"
                    disabled={!settings.ops.taxEnabled}
                  />
                  {settings.ops.taxEnabled && (
                    <Button size="sm" variant="outline" className="mt-2 min-h-[40px]" onClick={() => saveOps({ taxRate: settings.ops.taxRate }, "taxRate")}>
                      تطبيق النسبة
                    </Button>
                  )}
                </div>

                {(Object.keys(savingKeys).length > 0 || savingKeys.size > 0) && savingKeys.size > 0 && (
                  <p className="flex items-center gap-2 text-xs text-primary">
                    <Loader2 className="size-3.5 animate-spin" /> جارٍ الحفظ الفوري…
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Live preview sidebar */}
        <aside className="hidden lg:block">
          <Card className="sticky top-20">
            <CardContent className="p-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Eye className="size-4" />
                معاينة حية
              </p>
              <div className="rounded-xl border border-border bg-gradient-to-br from-muted/60 to-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
                    {(settings.name.trim() || "؟").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black">{settings.name || "اسم المتجر"}</p>
                    <p className="truncate text-xs text-muted-foreground">{settings.tagline || "شعار المتجر"}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{settings.description}</p>
                <div className="mt-3 flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
                  <span dir="ltr" className="text-right">{settings.phoneMain || "—"}</span>
                  <span>{settings.location || "—"}</span>
                  <span dir="ltr" className="truncate text-right">{settings.social.facebook || ""}</span>
                </div>
                {settings.hero.description && (
                  <p className="mt-3 rounded-lg bg-primary/10 p-2.5 text-center text-xs font-bold text-primary">
                    {settings.hero.ctaLabel || "تسوق الآن"}
                  </p>
                )}
              </div>

              {/* Ops status chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${settings.ops.maintenanceMode ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300" : "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"}`}>
                  {settings.ops.maintenanceMode ? "صيانة" : "يعمل"}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${settings.ops.ordersEnabled ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300"}`}>
                  {settings.ops.ordersEnabled ? "الطلبات مفتوحة" : "الطلبات موقوفة"}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${settings.ops.taxEnabled ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" : "bg-muted text-muted-foreground"}`}>
                  {settings.ops.taxEnabled ? `ضريبة ${settings.ops.taxRate}%` : "بدون ضريبة"}
                </span>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Store className="size-3.5 shrink-0" />
                المعاينة تعكس التعديلات قبل الحفظ.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
