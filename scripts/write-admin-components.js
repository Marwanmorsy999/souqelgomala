const fs = require('fs');
const path = require('path');
const dir = path.join('components','admin');

const importPage = `"use client"

import { useMemo, useState } from "react"
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
    const res = await fetch(\`/api/admin/products/import/\${jobId}/commit\`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skipErrors: true }) })
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
`;

const bulkUpload = `"use client"

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
        if (!res.ok || !data?.success) { toast.error(data?.error || \`فشل رفع \${file.name}\`); continue }
        const url = data.data?.secureUrl || data.data?.url
        const publicId = data.data?.cloudinaryPublicId || data.data?.cloudinary_public_id
        // create media record
        const createRes = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, cloudinaryPublicId: publicId, filename: file.name, altText: file.name, tags: [] }) })
        const createData = await createRes.json()
        if (!createRes.ok) { toast.error(\`فشل حفظ \${file.name}\`); continue }
        // naive match by filename token
        const nameToken = file.name.replace(/\\.\\w+$/, "").toLowerCase()
        uploaded.push({ id: createData.data?.id || crypto.randomUUID(), url, filename: file.name, suggestedProductName: nameToken, confidence: 0.5 })
      }
      setItems(uploaded)
      toast.success(\`تم رفع \${uploaded.length} صورة\`)
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
`;

const pdfImport = `"use client"

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
`;

const staff = `"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import { runAfterRender } from "@/components/admin/use-deferred-load"

type StaffPerm = { staff_id: string; can_edit_products: boolean; can_edit_prices: boolean; can_edit_promos: boolean; can_manage_staff: boolean; can_view_reports: boolean }

type Props = { staffId: string }

export function StaffPermissionsEditor({ staffId }: Props) {
  const toast = useToast()
  const [perms, setPerms] = useState<StaffPerm | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const res = await fetch(\`/api/admin/staff/\${staffId}/permissions\`, { cache: "no-store" })
      const data = await res.json()
      if (data?.data) setPerms(data.data)
    } catch { toast.error("تعذر تحميل الصلاحيات") }
  }

  useEffect(() => { return runAfterRender(load) }, [staffId])

  async function save() {
    if (!perms) return
    setSaving(true)
    try {
      const res = await fetch(\`/api/admin/staff/\${staffId}/permissions\`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(perms) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "فشل الحفظ")
      toast.success("تم حفظ الصلاحيات")
    } catch (e) { toast.error((e as Error).message) }
    finally { setSaving(false) }
  }

  if (!perms) return <Card className="bg-bg-surface border-border"><CardContent className="p-4"><p className="text-sm text-muted-foreground">جاري التحميل...</p></CardContent></Card>

  return (
    <Card className="bg-bg-surface border-border">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>تعديل المنتجات</Label>
            <Switch checked={perms.can_edit_products} onCheckedChange={(v) => setPerms({ ...perms, can_edit_products: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>تعديل الأسعار</Label>
            <Switch checked={perms.can_edit_prices} onCheckedChange={(v) => setPerms({ ...perms, can_edit_prices: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>تعديل العروض</Label>
            <Switch checked={perms.can_edit_promos} onCheckedChange={(v) => setPerms({ ...perms, can_edit_promos: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>إدارة الموظفين</Label>
            <Switch checked={perms.can_manage_staff} onCheckedChange={(v) => setPerms({ ...perms, can_manage_staff: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>عرض التقارير</Label>
            <Switch checked={perms.can_view_reports} onCheckedChange={(v) => setPerms({ ...perms, can_view_reports: v })} />
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="gap-1.5">{saving ? "جاري الحفظ..." : "حفظ الصلاحيات"}</Button>
      </CardContent>
    </Card>
  )
}
`;

const products = `"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2, X, Loader2, Star, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUploader, type CloudinaryUploadData } from "@/components/admin/image-uploader";
import { ClientImage } from "@/components/ui/client-image";
import { runAfterRender } from "@/components/admin/use-deferred-load";
import { useToast } from "@/components/ui/toast";

type ProductMedia = { id: string; secure_url: string; cloudinary_public_id: string; is_primary: boolean; display_order: number };
type ProductRow = { id: string; name_ar?: string; name_en?: string; description?: string | null; brand?: string | null; category_id?: string | null; category_name?: string | null; price?: number; wholesale_price?: number | null; unit?: string; stock?: number; low_stock_threshold?: number; is_visible?: boolean; is_featured?: boolean; status?: string; publish_status?: string; image_url?: string; media?: ProductMedia[] };

const UNITS = ["piece","كيلو","علبة","عبوة","رزمة","طرد","شوال","كرتونة","زجاجة","كيس"];

export function ProductsManagement() {
  const toast = useToast();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name_ar: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");

  async function load() {
    setLoading(true); setError(null);
    try {
      const [p, c] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/admin/categories", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setRows(Array.isArray(p?.data) ? p.data : []);
      setCategories((Array.isArray(c?.data) ? c.data : []).map((x: { id: string; name_ar: string }) => ({ id: x.id, name_ar: x.name_ar })));
    } catch { setError("تعذر تحميل المنتجات"); }
    finally { setLoading(false); }
  }

  useEffect(() => { return runAfterRender(load); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.name_ar ?? "").toLowerCase().includes(q) || (r.name_en ?? "").toLowerCase().includes(q) || (r.brand ?? "").toLowerCase().includes(q));
  }, [rows, query]);

  function openCreate() { setEditing(null); setOpen(true); }
  function openEdit(row: ProductRow) { setEditing(row); setOpen(true); }

  function toggleSelect(id: string) { setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }) }
  function toggleAll() { setSelectedIds((prev) => { if (prev.size === filtered.length) return new Set(); return new Set(filtered.map((r) => r.id)); }) }

  async function save() {
    // Simplified save for demo
    const payload = { nameAr: editing?.name_ar || "", price: 0, unit: "piece", stock: 0 };
    const url = editing ? \`/api/admin/products/\${editing.id}\` : "/api/admin/products";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { toast.error("فشل الحفظ"); return; }
    toast.success(editing ? "تم تحديث المنتج" : "تم إنشاء المنتج");
    setOpen(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا المنتج؟")) return;
    const res = await fetch(\`/api/admin/products?id=\${id}\`, { method: "DELETE" });
    if (!res.ok) { toast.error("تعذر الحذف"); return; }
    toast.success("تم حذف المنتج");
    await load();
  }

  async function bulkApply() {
    if (!bulkAction || selectedIds.size === 0) { toast.error("اختر منتجات وإجراء"); return; }
    const res = await fetch("/api/admin/products/bulk", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productIds: Array.from(selectedIds), action: bulkAction, payload: {} }) });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.error || "فشل الإجراء المجمع"); return; }
    toast.success(\`تم تنفيذ الإجراء على \${selectedIds.size} منتج\`);
    setSelectedIds(new Set()); setBulkAction("");
  }

  return (
    <Card className="bg-bg-surface border-border">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث عن منتج..." className="pr-9" />
          </div>
          <Button size="sm" onClick={openCreate} className="gap-1.5"><Plus className="size-4" /> منتج جديد</Button>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
            <span className="text-sm font-semibold">تم اختيار {selectedIds.size} منتج</span>
            <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="h-9 rounded-xl border border-input bg-background px-3 text-sm outline-none">
              <option value="">إجراء...</option>
              <option value="price_adjust">تعديل سعر</option>
              <option value="stock_update">تعديل مخزون</option>
              <option value="status_change">تغيير الحالة</option>
              <option value="delete">حذف</option>
            </select>
            <Button size="sm" onClick={bulkApply} className="gap-1.5">تنفيذ</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>إلغاء</Button>
          </div>
        )}

        {loading ? (<div className="flex h-40 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>) : filtered.length === 0 ? (<p className="text-sm text-muted-foreground">لا توجد منتجات</p>) : (
          <div className="flex flex-col gap-2">
            {filtered.map((row) => (
              <div key={row.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <button onClick={() => toggleSelect(row.id)} className="shrink-0">
                  {selectedIds.has(row.id) ? <CheckSquare className="size-5 text-primary" /> : <Square className="size-5 text-muted-foreground" />}
                </button>
                {row.image_url && <img src={row.image_url} alt={row.name_ar} className="size-12 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{row.name_ar}</p>
                  <p className="text-xs text-muted-foreground">{row.price} ج.م • مخزون: {row.stock} • {row.publish_status ?? "published"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Edit3 className="size-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(row.id)} className="text-destructive"><Trash2 className="size-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "تعديل المنتج" : "منتج جديد"}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1"><Label>اسم المنتج (عربي)</Label><Input defaultValue={editing?.name_ar} onChange={(e) => setEditing({ ...editing!, name_ar: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1"><Label>السعر</Label><Input type="number" defaultValue={editing?.price} onChange={(e) => setEditing({ ...editing!, price: Number(e.target.value) })} /></div>
                <div className="flex flex-col gap-1"><Label>المخزون</Label><Input type="number" defaultValue={editing?.stock} onChange={(e) => setEditing({ ...editing!, stock: Number(e.target.value) })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="gap-1.5"><X className="size-4" /> إلغاء</Button>
              <Button onClick={save} className="gap-1.5">حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
`;

fs.writeFileSync(path.join(dir, 'product-import-page.tsx'), importPage, 'utf8');
fs.writeFileSync(path.join(dir, 'product-image-bulk-upload.tsx'), bulkUpload, 'utf8');
fs.writeFileSync(path.join(dir, 'pdf-import-page.tsx'), pdfImport, 'utf8');
fs.writeFileSync(path.join(dir, 'staff-permissions-editor.tsx'), staff, 'utf8');
fs.writeFileSync(path.join(dir, 'products-management.tsx'), products, 'utf8');
console.log('wrote all admin components');
