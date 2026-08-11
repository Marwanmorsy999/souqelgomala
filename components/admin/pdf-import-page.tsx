"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"

export function PdfImportPage() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  async function upload() {
    if (!file) { toast.error("اختر ملف PDF"); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/admin/products/import/pdf", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "فشل الاستيراد")
      toast.success("تم رفع PDF وجاري المعالجة لإنشاء منتجات مسودة")
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploading(false) }
  }

  return (
    <Card className="bg-bg-surface border-border">
      <CardContent className="flex flex-col gap-4 p-4">
        <p className="text-sm text-muted-foreground">ارفع قائمة أسعار PDF من الموردين. سيتم إنشاء منتجات بحالة مسودة فقط (غير منشورة) للمراجعة يدوياً.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button onClick={upload} disabled={uploading || !file} className="gap-1.5">
            {uploading && <span className="size-4 animate-spin" />} رفع ومعالجة
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
