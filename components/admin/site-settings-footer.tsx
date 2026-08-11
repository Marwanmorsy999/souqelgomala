"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"
import { ReorderableLinkList, type ReorderItem } from "@/components/admin/reorderable-link-list"

type FooterLinkRow = {
  id: string
  section: "quick_links" | "contact" | "social"
  label: string
  url: string
  sort_order: number
  visible: boolean
}

const SECTIONS = [
  { key: "quick_links", label: "روابط سريعة" },
  { key: "contact", label: "التواصل" },
  { key: "social", label: "السوشيال ميديا" },
] as const

export function FooterEditor() {
  const toast = useToast()
  const [rows, setRows] = useState<FooterLinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<(typeof SECTIONS)[number]["key"]>("quick_links")

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/footer-links", { cache: "no-store" })
      const body = await res.json()
      if (body?.success) setRows(body.data)
      else toast.error(body?.error ?? "تعذر تحميل روابط التذييل")
    } catch {
      toast.error("تعذر تحميل روابط التذييل")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return runAfterRender(load)
  }, [])

  const sectionItems: ReorderItem[] = useMemo(
    () =>
      rows
        .filter((r) => r.section === active)
        .map((r) => ({ id: r.id, label: r.label, url: r.url, visible: r.visible, section: r.section })),
    [rows, active],
  )

  function updateSectionItems(next: ReorderItem[]) {
    // Apply changes to the section in the full rows array.
    const others = rows.filter((r) => r.section !== active)
    const mapped: FooterLinkRow[] = next.map((it) => ({
      id: it.id,
      section: active,
      label: it.label,
      url: it.url,
      sort_order: 0,
      visible: it.visible,
    }))
    setRows([...others, ...mapped])
  }

  async function persist(next: ReorderItem[]) {
    const ids = next.map((i) => i.id).filter((id) => !id.startsWith("new-"))
    await fetch("/api/admin/footer-links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    for (const it of next) {
      if (it.id.startsWith("new-")) {
        const res = await fetch("/api/admin/footer-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: active, label: it.label, url: it.url }),
        })
        const created = await res.json()
        if (res.ok && created?.data?.id) it.id = created.data.id
      } else {
        await fetch(`/api/admin/footer-links/${it.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: it.label, url: it.url, visible: it.visible, section: active }),
        })
      }
    }
    const currentIds = new Set(next.map((i) => i.id))
    for (const r of rows.filter((x) => x.section === active)) {
      if (!currentIds.has(r.id)) await fetch(`/api/admin/footer-links/${r.id}`, { method: "DELETE" })
    }
    await load()
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
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                active === s.key ? "bg-brand-green text-white" : "bg-muted/60 text-text-secondary hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <ReorderableLinkList
          items={sectionItems}
          onChange={updateSectionItems}
          onSave={persist}
          addLabel="إضافة رابط"
        />
      </CardContent>
    </Card>
  )
}
