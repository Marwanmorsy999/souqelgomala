"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"
import { ReorderableLinkList, type ReorderItem } from "@/components/admin/reorderable-link-list"

type NavLinkRow = {
  id: string
  label: string
  url: string
  sort_order: number
  visible: boolean
  target: "internal" | "external"
}

export function NavigationEditor() {
  const toast = useToast()
  const [items, setItems] = useState<ReorderItem[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/nav-links", { cache: "no-store" })
      const body = await res.json()
      if (body?.success) {
        setItems(
          (body.data as NavLinkRow[]).map((r) => ({
            id: r.id,
            label: r.label,
            url: r.url,
            visible: r.visible,
            target: r.target,
          })),
        )
      } else toast.error(body?.error ?? "تعذر تحميل روابط التنقل")
    } catch {
      toast.error("تعذر تحميل روابط التنقل")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return runAfterRender(load)
  }, [])

  // Persist order + visibility + inline edits in a single batch.
  async function persist(next: ReorderItem[]) {
    // Reorder first.
    const ids = next.map((i) => i.id).filter((id) => !id.startsWith("new-"))
    await fetch("/api/admin/nav-links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })

    // Upsert each persisted/edited row.
    for (const it of next) {
      if (it.id.startsWith("new-")) {
        const res = await fetch("/api/admin/nav-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: it.label, url: it.url, target: it.target ?? "internal" }),
        })
        const created = await res.json()
        if (res.ok && created?.data?.id) it.id = created.data.id
      } else {
        await fetch(`/api/admin/nav-links/${it.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: it.label, url: it.url, visible: it.visible, target: it.target ?? "internal" }),
        })
      }
    }
    // Remove items that were deleted locally (existed on server, now gone).
    const currentIds = new Set(next.map((i) => i.id))
    const before = items.map((i) => i.id)
    for (const id of before) {
      if (!currentIds.has(id) && !id.startsWith("new-")) {
        await fetch(`/api/admin/nav-links/${id}`, { method: "DELETE" })
      }
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
      <CardContent className="p-5">
        <ReorderableLinkList
          items={items}
          onChange={setItems}
          onSave={persist}
          showTarget
          addLabel="إضافة رابط تنقل"
        />
      </CardContent>
    </Card>
  )
}
