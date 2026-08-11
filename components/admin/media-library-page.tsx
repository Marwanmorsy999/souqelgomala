"use client"

import { useEffect, useMemo, useState } from "react"
import { ImagePlus, Loader2, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type MediaRow = {
  id: string
  url: string
  cloudinary_public_id: string
  filename: string
  alt_text?: string | null
  tags: string[]
  width?: number | null
  height?: number | null
  format?: string | null
  usage_count: number
  uploaded_at: string
}

export function MediaLibraryPage() {
  const toast = useToast()
  const [rows, setRows] = useState<MediaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [showUnused, setShowUnused] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = { current: null as HTMLInputElement | null } as { current: HTMLInputElement | null }
  const setFileRef = (el: HTMLInputElement | null) => { fileRef.current = el }

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set("search", query.trim())
      if (tagFilter.trim()) params.set("tag", tagFilter.trim())
      if (showUnused) params.set("unused", "true")
      const res = await fetch(`/api/admin/media?${params.toString()}`, { cache: "no-store" })
      const data = await res.json()
      setRows(Array.isArray(data?.data) ? data.data : [])
    } catch { toast.error("تعذر تحميل الوسائط") }
    finally { setLoading(false) }
  }

  useEffect(() => { return runAfterRender(load) }, [])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [query, tagFilter, showUnused])

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append("file", file)
        const uploadRes = await fetch("/api/admin/media/upload", { method: "POST", body: form })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok || !uploadData?.success) { toast.error(uploadData?.error || `فشل رفع ${file.name}`); continue }
        const createRes = await fetch("/api/admin/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: uploadData.data?.secureUrl || uploadData.data?.url, cloudinaryPublicId: uploadData.data?.cloudinaryPublicId || uploadData.data?.cloudinary_public_id, filename: file.name, altText: file.name, tags: [] })
        })
        if (createRes.ok) toast.success(`تم رفع ${file.name}`)
        else toast.error(`فشل حفظ سجل ${file.name}`)
      }
      await load()
    } catch { toast.error("فشل الاتصال أثناء الرفع") }
    finally { setUploading(false) }
  }

  async function remove(row: MediaRow) {
    if (row.usage_count > 0) { if (!confirm(`هذا الوسيط مستخدم في ${row.usage_count} موضع. حذفه قد يسبب روابط مكسورة. متأكد؟`)) return }
    const res = await fetch(`/api/admin/media/${row.id}`, { method: "DELETE" })
    if (!res.ok) { const data = await res.json().catch(() => ({})); toast.error(data?.error || "تعذر حذف الوسيط"); return }
    toast.success("تم حذف الوسيط")
    await load()
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const t = tagFilter.trim().toLowerCase()
    return rows.filter((r) => {
      if (q && !r.filename.toLowerCase().includes(q) && !(r.alt_text ?? "").toLowerCase().includes(q)) return false
      if (t && !r.tags.some((tag) => tag.toLowerCase().includes(t))) return false
      if (showUnused && r.usage_count > 0) return false
      return true
    })
  }, [rows, query, tagFilter, showUnused])

  return (
    <Card className="bg-bg-surface border-border">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث باسم الملف..." className="pr-9" />
          </div>
          <Input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="فلتر بالوسوم" className="w-40" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showUnused} onChange={(e) => setShowUnused(e.target.checked)} className="size-4 rounded" />
            غير مستخدم فقط
          </label>
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="gap-1.5">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            رفع صور
          </Button>
          <input ref={setFileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        </div>

        {loading ? (<div className="flex h-40 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>) : filtered.length === 0 ? (<p className="text-sm text-muted-foreground">لا توجد وسائط</p>) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filtered.map((row) => (
              <div key={row.id} className="group relative flex flex-col gap-2 rounded-xl border border-border p-2">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <img src={row.url} alt={row.filename} className="size-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => remove(row)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{row.filename}</p>
                  <div className="mt-1 flex flex-wrap gap-1">{row.tags.slice(0,2).map((tag) => (<Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">{tag}</Badge>))}</div>
                  <p className="mt-1 text-[10px] text-muted-foreground">استخدام: {row.usage_count}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
