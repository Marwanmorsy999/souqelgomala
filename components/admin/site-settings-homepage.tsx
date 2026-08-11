"use client"

import { useEffect, useState } from "react"
import { Loader2, Eye, EyeOff, GripVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type SectionRow = {
  id: string
  section_key: "hero" | "deals_strip" | "products" | "social_strip"
  visible: boolean
  sort_order: number
}

const LABELS: Record<SectionRow["section_key"], string> = {
  hero: "الهيرو",
  deals_strip: "شريط العروض",
  products: "المنتجات",
  social_strip: "السوشيال ميديا",
}

export function HomepageLayoutManager() {
  const toast = useToast()
  const [sections, setSections] = useState<SectionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/homepage-sections", { cache: "no-store" })
      const body = await res.json()
      if (body?.success) setSections(body.data)
      else toast.error(body?.error ?? "تعذر تحميل أقسام الصفحة")
    } catch {
      toast.error("تعذر تحميل أقسام الصفحة")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return runAfterRender(load)
  }, [])

  function toggleVisibility(id: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)))
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= sections.length || from === to) return
    const next = sections.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setSections(next)
  }

  async function persist() {
    setSaving(true)
    try {
      const ids = sections.map((s) => s.id)
      await fetch("/api/admin/homepage-sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      for (const s of sections) {
        await fetch(`/api/admin/homepage-sections/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visible: s.visible }),
        })
      }
      toast.success("تم حفظ تخطيط الصفحة الرئيسية")
      await load()
    } catch (e) {
      toast.error((e as Error).message || "تعذر الحفظ")
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

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <p className="text-sm text-muted-foreground">
          رتّب أقسام الصفحة الرئيسية وحدد الظاهر منها. التغييرات لا تؤثر على المتجر إلا بعد الحفظ.
        </p>
        <ul className="flex flex-col gap-2">
          {sections.map((s, index) => (
            <li
              key={s.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (dragIndex !== null) move(dragIndex, index)
                setDragIndex(null)
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`flex items-center gap-3 rounded-xl border border-border bg-bg-surface p-3 ${
                dragIndex === index ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="size-4 cursor-grab text-muted-foreground" />
              <span className="flex-1 text-sm font-semibold">{LABELS[s.section_key] ?? s.section_key}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleVisibility(s.id)}
                aria-label={s.visible ? "إخفاء" : "إظهار"}
              >
                {s.visible ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted-foreground" />}
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <Button onClick={persist} disabled={saving} className="gap-1.5">
            {saving && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            حفظ التخطيط
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
