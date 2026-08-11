"use client";

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
    const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { toast.error("فشل الحفظ"); return; }
    toast.success(editing ? "تم تحديث المنتج" : "تم إنشاء المنتج");
    setOpen(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا المنتج؟")) return;
    const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("تعذر الحذف"); return; }
    toast.success("تم حذف المنتج");
    await load();
  }

  async function bulkApply() {
    if (!bulkAction || selectedIds.size === 0) { toast.error("اختر منتجات وإجراء"); return; }
    const res = await fetch("/api/admin/products/bulk", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productIds: Array.from(selectedIds), action: bulkAction, payload: {} }) });
    const data = await res.json();
    if (!res.ok) { toast.error(data?.error || "فشل الإجراء المجمع"); return; }
    toast.success(`تم تنفيذ الإجراء على ${selectedIds.size} منتج`);
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
