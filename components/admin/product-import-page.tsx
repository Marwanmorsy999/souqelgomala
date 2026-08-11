"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type JobRow = { id: string; type: string; filename: string; status: string; row_count: number; error_count: number; error_log?: string | null; created_at: string }

export function ProductImportPage() {
  const toast = useToast()
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/products/import", { cache: "no-store" })
      const data = await res.json()
      setJobs(Array.isArray(data?.data) ? data.data : [])
    } catch { toast.error("تعذر تحميل سجل الاستيراد") }
    finally { setLoading(false) }
  }

  useEffect(() => { return runAfterRender(load) }, [])

  async function upload() {
    if (!file) { toast.error("اختر ملفاً أولاً"); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/admin/products/import", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "فشل الرفع")
      toast.success("تم رفع الملف وجاري المعالجة")
      setFile(null)
      await load()
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploading(false) }
  }

  async function commit(jobId: string) {
    const res = await fetch(`/api/admin/products/import/${jobId}/commit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skipErrors: true }) })
    const data = await res.json()
    if (!res.ok) { toast.error(data?.error || "فشل التأكيد"); return }
    toast.success("تم تأكيد الاستيراد")
    await load()
  }

  return (
    <Card className="bg-bg-surface border-border">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button onClick={upload} disabled={uploading || !file} className="gap-1.5">
            {uploading && <span className="size-4 animate-spin" />} رفع وتشغيل التحقق
          </Button>
          <Button variant="outline" onClick={load} className="gap-1.5">تحديث</Button>
        </div>

        {loading ? (<div className="flex h-32 items-center justify-center"><span className="text-sm text-muted-foreground">جاري التحميل...</span></div>) : jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد عمليات استيراد بعد</p>
        ) : (
          <div className="flex flex-col gap-2">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{job.filename}</p>
                  <p className="text-xs text-muted-foreground">{job.type} • {job.row_count} صف • {job.error_count} أخطاء • {job.status}</p>
                  {job.error_log && <Textarea value={job.error_log} readOnly rows={3} className="mt-2 text-xs" />}
                </div>
                {job.status === "validated" && (
                  <Button size="sm" onClick={() => commit(job.id)} className="gap-1.5">تأكيد الاستيراد</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
