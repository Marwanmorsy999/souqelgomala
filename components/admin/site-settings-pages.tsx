"use client"

import { useEffect, useState } from "react"
import { Edit3, Plus, Trash2, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type PageRow = {
  id: string
  slug: string
  title: string
  content: string
  meta_title?: string | null
  meta_description?: string | null
  published: boolean
}

export function StaticPagesEditor() {
  const toast = useToast()
  const [rows, setRows] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PageRow | null>(null)
  const [open, setOpen] = useState(false)
  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/pages", { cache: "no-store" })
      const body = await res.json()
      setRows(Array.isArray(body?.data) ? body.data : [])
    } catch {
      toast.error("تعذر تحميل الصفحات")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return runAfterRender(load)
  }, [])

  function openCreate() {
    setEditing(null); setSlug(""); setTitle(""); setContent(""); setMetaTitle(""); setMetaDescription(""); setPublished(false); setOpen(true)
  }
  function openEdit(p: PageRow) {
    setEditing(p); setSlug(p.slug); setTitle(p.title); setContent(p.content); setMetaTitle(p.meta_title ?? ""); setMetaDescription(p.meta_description ?? ""); setPublished(p.published); setOpen(true)
  }

  async function save() {
    if (!slug.trim() || !title.trim() || !content.trim()) { toast.error("الرابط والعنوان والمحتوى مطلوبة"); return }
    setSaving(true)
    const payload = {
      slug: slug.trim(),
      title: title.trim(),
      content,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      published,
    }
    try {
      const url = editing ? `/api/admin/pages/${editing.id}` : "/api/admin/pages"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const body = await res.json()
      if (!res.ok || !body?.success) { toast.error(body?.error ?? "تعذر الحفظ"); return }
      toast.success(editing ? "تم تحديث الصفحة" : "تم إنشاء الصفحة")
      setOpen(false)
      await load()
    } catch {
      toast.error("تعذر الحفظ")
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm("حذف هذه الصفحة؟")) return
    const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("تم حذف الصفحة"); await load() }
    else toast.error("تعذر الحذف")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="gap-1.5"><Plus className="size-4" /> صفحة جديدة</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> جارٍ التحميل…</div>
          ) : rows.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground">لا توجد صفحات.</p>
          ) : (
            <ul className="divide-y">
              {rows.map((p) => (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  <FileText className="size-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">/{p.slug}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.published ? "bg-primary/10 text-primary" : "bg-muted/40 text-muted-foreground"}`}>
                    {p.published ? "منشور" : "مسودة"}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label="تعديل"><Edit3 className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)} className="text-destructive" aria-label="حذف"><Trash2 className="size-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "تعديل صفحة" : "صفحة جديدة"}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1"><Label htmlFor="slug">الرابط (slug)</Label><Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" placeholder="about" /></div>
              <div className="flex flex-col gap-1"><Label htmlFor="ptitle">العنوان</Label><Input id="ptitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            </div>
            <div className="flex flex-col gap-1"><Label htmlFor="content">المحتوى (HTML / Markdown)</Label><Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="font-mono text-xs" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1"><Label htmlFor="mtitle">عنوان Meta</Label><Input id="mtitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} /></div>
              <div className="flex flex-col gap-1"><Label htmlFor="mdesc">وصف Meta</Label><Input id="mdesc" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="size-4 rounded" /> منشور</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="gap-1.5">إلغاء</Button>
            <Button onClick={save} disabled={saving} className="gap-1.5">{saving && <Loader2 className="size-4 animate-spin" />} حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
