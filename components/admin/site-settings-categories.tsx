"use client"

import { useEffect, useState } from "react"
import { Edit3, Plus, Search, Trash2, GripVertical, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClientImage } from "@/components/ui/client-image"
import { runAfterRender } from "@/components/admin/use-deferred-load"
import { useToast } from "@/components/ui/toast"

type CategoryRow = {
  id: string
  name_ar: string
  name_en?: string | null
  parent_id?: string | null
  image?: string | null
  icon_url?: string | null
  is_visible?: boolean
  sort_order?: number
}

export function CategoryManager() {
  const toast = useToast()
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [open, setOpen] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)
  const [dependency, setDependency] = useState<{ count: number; candidates: CategoryRow[] } | null>(null)
  const [reassignTo, setReassignTo] = useState<string>("")

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" })
      const body = await res.json()
      setRows(Array.isArray(body?.data) ? body.data : [])
    } catch {
      toast.error("تعذر تحميل الأقسام")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return runAfterRender(load)
  }, [])

  const filtered = query.trim()
    ? rows.filter((r) => r.name_ar.toLowerCase().includes(query.trim().toLowerCase()))
    : rows

  function move(from: number, to: number) {
    if (to < 0 || to >= rows.length || from === to) return
    const next = rows.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setRows(next)
  }

  async function persistOrder() {
    setSavingOrder(true)
    try {
      await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: rows.map((r) => r.id) }),
      })
      toast.success("تم حفظ الترتيب")
    } catch {
      toast.error("تعذر حفظ الترتيب")
    } finally {
      setSavingOrder(false)
    }
  }

  async function confirmDelete(row: CategoryRow) {
    setDeleteTarget(row)
    setDependency(null)
    setReassignTo("")
    try {
      const res = await fetch(`/api/admin/categories/${row.id}/product-count`, { cache: "no-store" })
      const body = await res.json()
      const count = body?.data?.productCount ?? 0
      const candidates = rows.filter((r) => r.id !== row.id)
      setDependency({ count, candidates })
    } catch {
      setDependency({ count: 0, candidates: rows.filter((r) => r.id !== row.id) })
    }
  }

  async function doDelete() {
    if (!deleteTarget) return
    const url = reassignTo
      ? `/api/admin/categories/${deleteTarget.id}?reassignTo=${encodeURIComponent(reassignTo)}`
      : `/api/admin/categories/${deleteTarget.id}`
    const res = await fetch(url, { method: "DELETE" })
    const body = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success("تم حذف القسم")
      setDeleteTarget(null)
      setDependency(null)
      setReassignTo("")
      await load()
    } else {
      toast.error(body?.error ?? "تعذر حذف القسم")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث عن قسم…" className="pr-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={persistOrder} disabled={savingOrder} className="gap-1.5">
            {savingOrder && <Loader2 className="size-4 animate-spin" />} حفظ الترتيب
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true) }} className="gap-1.5">
            <Plus className="size-4" /> قسم جديد
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> جارٍ التحميل…
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground">لا توجد أقسام.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((r, index) => (
                <li
                  key={r.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) move(dragIndex, index); setDragIndex(null) }}
                  onDragEnd={() => setDragIndex(null)}
                  className="flex items-center gap-3 p-3"
                >
                  <GripVertical className="size-4 cursor-grab text-muted-foreground" />
                  <ClientImage src={r.image || r.icon_url || ""} alt={r.name_ar} className="size-10 rounded-full" imgClassName="size-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{r.name_ar}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">{r.name_en || "—"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.is_visible === false ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                    {r.is_visible === false ? "مخفي" : "ظاهر"}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true) }} aria-label="تعديل">
                      <Edit3 className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(r)} className="text-destructive" aria-label="حذف">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CategoryDialog
        key={editing?.id ?? "new"}
        open={open}
        row={editing}
        onClose={() => setOpen(false)}
        onSaved={() => { setOpen(false); load() }}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>حذف القسم</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-sm">هل تريد حذف &quot;{deleteTarget?.name_ar}&quot;؟</p>
            {dependency && dependency.count > 0 && (
              <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <AlertTriangle className="size-4" /> يحتوي على {dependency.count} منتجًا
                </p>
                <Label>إعادة تعيين المنتجات إلى قسم:</Label>
                <select
                  id="reassign"
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="h-9 rounded-lg border border-input bg-muted/60 px-2 text-sm outline-none"
                >
                  <option value="">— اختر قسمًا —</option>
                  {dependency.candidates.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_ar}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => doDelete()}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CategoryDialog({
  open,
  row,
  onClose,
  onSaved,
}: {
  open: boolean
  row: CategoryRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const [nameAr, setNameAr] = useState(row?.name_ar ?? "")
  const [nameEn, setNameEn] = useState(row?.name_en ?? "")
  const [imageUrl, setImageUrl] = useState(row?.image ?? "")
  const [iconUrl, setIconUrl] = useState(row?.icon_url ?? "")
  const [parentId, setParentId] = useState(row?.parent_id ?? "")
  const [visible, setVisible] = useState(row?.is_visible !== false)
  const [parents, setParents] = useState<CategoryRow[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      setNameAr(row?.name_ar ?? "")
      setNameEn(row?.name_en ?? "")
      setParentId(row?.parent_id ?? "")
      setImageUrl(row?.image ?? "")
      setIconUrl(row?.icon_url ?? "")
      setVisible(row?.is_visible !== false)
    }, 0)
    return () => window.clearTimeout(t)
  }, [open, row])

  useEffect(() => {
    if (!open) return
    let active = true
    fetch("/api/admin/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => {
        if (!active) return
        const list = Array.isArray(b?.data) ? b.data : []
        setParents(list.filter((c: CategoryRow) => !c.parent_id && c.id !== row?.id))
      })
      .catch(() => active && setParents([]))
    return () => { active = false }
  }, [open, row?.id])

  async function save() {
    if (!nameAr.trim()) { setError("اسم القسم مطلوب"); return }
    setSaving(true)
    setError(null)
    const payload = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || undefined,
      parentId: parentId || null,
      image: imageUrl || undefined,
      iconUrl: iconUrl || undefined,
      isVisible: visible,
    }
    try {
      const res = row
        ? await fetch(`/api/admin/categories/${row.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
      const body = await res.json()
      if (!res.ok || !body?.success) { setError(body?.error ?? "تعذر الحفظ"); return }
      toast.success(row ? "تم تحديث القسم" : "تم إنشاء القسم")
      onSaved()
    } catch {
      setError("تعذر الحفظ — تحقق من الاتصال")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader><DialogTitle>{row ? "تعديل قسم" : "قسم جديد"}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="cNameAr">اسم القسم (عربي) *</Label>
              <Input id="cNameAr" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="cNameEn">الاسم (إنجليزي)</Label>
              <Input id="cNameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="cParent">القسم الأب</Label>
            <select id="cParent" value={parentId} onChange={(e) => setParentId(e.target.value)} className="h-9 rounded-lg border border-input bg-muted/60 px-2 text-sm outline-none">
              <option value="">— قسم رئيسي —</option>
              {parents.map((p) => (<option key={p.id} value={p.id}>{p.name_ar}</option>))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="cImage">رابط صورة القسم</Label>
            <Input id="cImage" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} dir="ltr" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="cIcon">رابط أيقونة القسم</Label>
            <Input id="cIcon" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} dir="ltr" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="size-4 rounded" />
            ظاهر في المتجر
          </label>
          {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="gap-1.5">إلغاء</Button>
          <Button onClick={save} disabled={saving} className="gap-1.5">{saving && <Loader2 className="size-4 animate-spin" />} حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
