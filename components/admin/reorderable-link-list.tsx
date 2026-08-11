"use client"

import { useState, type ReactNode } from "react"
import { GripVertical, Trash2, Eye, EyeOff, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"

export type ReorderItem = {
  id: string
  label: string
  url: string
  visible: boolean
  target?: "internal" | "external"
  section?: string
}

type Props = {
  items: ReorderItem[]
  onChange: (items: ReorderItem[]) => void
  onSave: (items: ReorderItem[]) => Promise<void> | void
  /** Show the internal/external target toggle. */
  showTarget?: boolean
  /** Extra field rendered in the edit row (e.g. footer section select). */
  extraField?: (item: ReorderItem, onChange: (patch: Partial<ReorderItem>) => void) => ReactNode
  /** Label for the "add" button. */
  addLabel?: string
}

/**
 * Shared drag-to-reorder link list used by both the Navigation editor and the
 * Footer editor (quick_links / contact / social). Emits the new order on drop;
 * persist with the parent's onSave (which calls the reorder + upsert endpoints).
 */
export function ReorderableLinkList({
  items,
  onChange,
  onSave,
  showTarget = false,
  extraField,
  addLabel = "إضافة رابط",
}: Props) {
  const toast = useToast()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [editing, setEditing] = useState<ReorderItem | null>(null)
  const [saving, setSaving] = useState(false)

  function patchItem(id: string, patch: Partial<ReorderItem>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return
    const next = items.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  async function commitReorder() {
    setSaving(true)
    try {
      await onSave(items)
      toast.success("تم حفظ الترتيب")
    } catch (e) {
      toast.error((e as Error).message || "تعذر الحفظ")
    } finally {
      setSaving(false)
    }
  }

  function addItem() {
    const blank: ReorderItem = {
      id: `new-${crypto.randomUUID()}`,
      label: "",
      url: "",
      visible: true,
      target: "internal",
    }
    onChange([...items, blank])
    setEditing(blank)
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <p className="rounded-lg border border-border bg-bg-surface p-4 text-center text-sm text-muted-foreground">
          لا توجد عناصر بعد
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault()
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragIndex !== null) move(dragIndex, index)
              setDragIndex(null)
            }}
            onDragEnd={() => setDragIndex(null)}
            className={`flex items-center gap-2 rounded-xl border border-border bg-bg-surface p-3 ${
              dragIndex === index ? "opacity-50" : ""
            }`}
          >
            <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
            <span className={`size-2 shrink-0 rounded-full ${item.visible ? "bg-brand-green" : "bg-muted"}`} />
            <div className="min-w-0 flex-1">
              {editing?.id === item.id ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={item.label}
                      onChange={(e) => patchItem(item.id, { label: e.target.value })}
                      placeholder="النص"
                      className="min-w-[120px] flex-1"
                    />
                    <Input
                      value={item.url}
                      onChange={(e) => patchItem(item.id, { url: e.target.value })}
                      placeholder="الرابط"
                      dir="ltr"
                      className="min-w-[160px] flex-1"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {showTarget && (
                      <select
                        value={item.target ?? "internal"}
                        onChange={(e) => patchItem(item.id, { target: e.target.value as "internal" | "external" })}
                        className="h-9 rounded-lg border border-input bg-muted/60 px-2 text-sm outline-none"
                      >
                        <option value="internal">داخلي</option>
                        <option value="external">خارجي</option>
                      </select>
                    )}
                    {extraField?.(item, (patch) => patchItem(item.id, patch))}
                    <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                      تم
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="block w-full text-start"
                >
                  <p className="truncate text-sm font-semibold">{item.label || "—"}</p>
                  <p className="truncate text-xs text-muted-foreground" dir="ltr">
                    {item.url}
                  </p>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => patchItem(item.id, { visible: !item.visible })}
                aria-label={item.visible ? "إخفاء" : "إظهار"}
              >
                {item.visible ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted-foreground" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onChange(items.filter((it) => it.id !== item.id))}
                className="text-destructive"
                aria-label="حذف"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
          <Plus className="size-4" /> {addLabel}
        </Button>
        <Button size="sm" onClick={commitReorder} disabled={saving} className="gap-1.5">
          {saving && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          حفظ الترتيب
        </Button>
      </div>
    </div>
  )
}
