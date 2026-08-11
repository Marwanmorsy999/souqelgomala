"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type MatchRow = { id: string; url: string; filename: string; suggestedProductId?: string; suggestedProductName?: string; confidence: number }

export function ProductImageBulkUpload() {
  const toast = useToast()
  const [items, setItems] = useState<MatchRow[]>([])
  const [uploading, setUploading] = useState(false)

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    try {
      const uploaded: MatchRow[] = []
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch("/api/admin/media/upload", { method: "POST", body: form })
        const data = await res.json()
        if (!res.ok || !data?.success) { toast.error(data?.error || `فشل رفع ${file.name}`); continue }
        const url = data.data?.secureUrl || data.data?.url
        const publicId = data.data?.cloudinaryPublicId || data.data?.cloudinary_public_id
        // create media record
        const createRes = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, cloudinaryPublicId: publicId, filename: file.name, altText: file.name, tags: [] }) })
        const createData = await createRes.json()
        if (!createRes.ok) { toast.error(`فشل حفظ ${file.name}`); continue }
        // naive match by filename token
        const nameToken = file.name.replace(/\.\w+$/, "").toLowerCase()
        uploaded.push({ id: createData.data?.id || crypto.randomUUID(), url, filename: file.name, suggestedProductName: nameToken, confidence: 0.5 })
      }
      setItems(uploaded)
      toast.success(`تم رفع ${uploaded.length} صورة`)
    } catch { toast.error("فشل الاتصال") }
    finally { setUploading(false) }
  }

  async function attach() {
    // Placeholder: in production send matches to backend to create media_product rows
    toast.success("تم حفظ المطابقات (تجريبي)")
  }

  return (
    <Card className="bg-bg-surface border-border">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input type="file" accept="image/*" multiple onChange={(e) => handleUpload(e.target.files)} />
          <Button onClick={attach} disabled={!items.length} className="gap-1.5">تأكيد المطابقات</Button>
        </div>
        {items.length === 0 ? (<p className="text-sm text-muted-foreground">ارفع صور لاقتراح مطابقات مع المنتجات</p>) : (
          <div className="flex flex-col gap-2">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
                <img src={it.url} alt={it.filename} className="size-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.filename}</p>
                  <p className="text-xs text-muted-foreground">اقتراح: {it.suggestedProductName ?? "---"} ({Math.round((it.confidence ?? 0) * 100)}%)</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
