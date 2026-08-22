"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
  Loader2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientImage } from "@/components/ui/client-image";
import { Skeleton } from "@/components/feedback/skeleton";
import { runAfterRender } from "@/components/admin/use-deferred-load";
import { useToast } from "@/components/ui/toast";

type ProductMedia = { id: string; secure_url: string; cloudinary_public_id: string; is_primary: boolean; display_order: number };
type ProductRow = {
  id: string;
  name_ar?: string;
  name_en?: string;
  description?: string | null;
  brand?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  price?: number;
  wholesale_price?: number | null;
  unit?: string;
  stock?: number;
  low_stock_threshold?: number;
  is_visible?: boolean;
  is_featured?: boolean;
  status?: string;
  publish_status?: string;
  image_url?: string;
  media?: ProductMedia[];
};

const UNITS = ["piece", "كيلو", "علبة", "عبوة", "رزمة", "طرد", "شوال", "كرتونة", "زجاجة", "كيس"];

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

function stockStatus(row: ProductRow): Exclude<StockFilter, "all"> {
  const stock = Number(row.stock ?? 0);
  if (stock <= 0) return "out_of_stock";
  if (stock <= (row.low_stock_threshold ?? 5)) return "low_stock";
  return "in_stock";
}

const STOCK_LABELS: Record<Exclude<StockFilter, "all">, string> = {
  in_stock: "متوفر",
  low_stock: "مخزون منخفض",
  out_of_stock: "نفذت الكمية",
};

const STOCK_CLASSES: Record<Exclude<StockFilter, "all">, string> = {
  in_stock: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300",
  low_stock: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
  out_of_stock: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
};

interface ProductFormState {
  name_ar: string;
  name_en: string;
  brand: string;
  category_id: string;
  price: number;
  wholesale_price: number;
  unit: string;
  stock: number;
  description: string;
}

const EMPTY_FORM: ProductFormState = {
  name_ar: "",
  name_en: "",
  brand: "",
  category_id: "",
  price: 0,
  wholesale_price: 0,
  unit: "piece",
  stock: 0,
  description: "",
};

export function ProductsManagement() {
  const toast = useToast();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name_ar: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/admin/categories", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setRows(Array.isArray(p?.data) ? p.data : []);
      setCategories(
        (Array.isArray(c?.data) ? c.data : []).map((x: { id: string; name_ar: string }) => ({ id: x.id, name_ar: x.name_ar })),
      );
    } catch {
      toast.error("تعذر تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return runAfterRender(load);
  }, []);

  const filtered = useMemo(() => {
    let list = rows;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.name_ar ?? "").toLowerCase().includes(q) ||
          (r.name_en ?? "").toLowerCase().includes(q) ||
          (r.brand ?? "").toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== "all") list = list.filter((r) => r.category_id === categoryFilter);
    if (stockFilter !== "all") list = list.filter((r) => stockStatus(r) === stockFilter);
    return list;
  }, [rows, query, categoryFilter, stockFilter]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setOpen(true);
  }

  function openEdit(row: ProductRow) {
    setEditing(row);
    setForm({
      name_ar: row.name_ar ?? "",
      name_en: row.name_en ?? "",
      brand: row.brand ?? "",
      category_id: row.category_id ?? "",
      price: Number(row.price ?? 0),
      wholesale_price: Number(row.wholesale_price ?? 0),
      unit: row.unit ?? "piece",
      stock: Number(row.stock ?? 0),
      description: row.description ?? "",
    });
    setFormErrors({});
    setOpen(true);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id))));
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name_ar.trim()) errors.name_ar = "اسم المنتج بالعربي مطلوب";
    if (!(form.price > 0)) errors.price = "أدخل سعراً أكبر من صفر";
    if (!form.unit.trim()) errors.unit = "الوحدة مطلوبة";
    if (!(form.stock >= 0)) errors.stock = "المخزون لا يكون سالباً";
    if (form.wholesale_price > 0 && form.wholesale_price > form.price) errors.wholesale_price = "سعر الجملة أقل من سعر البيع؟ تأكد من الأرقام";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function save() {
    if (!validateForm()) return;
    setSaving(true);
    // API contract (createProductSchema): camelCase payload.
    const payload = {
      nameAr: form.name_ar.trim(),
      nameEn: form.name_en.trim() || undefined,
      brand: form.brand.trim() || undefined,
      categoryId: form.category_id || undefined,
      price: form.price,
      wholesalePrice: form.wholesale_price > 0 ? form.wholesale_price : undefined,
      unit: form.unit.trim(),
      stock: Math.round(form.stock),
      description: form.description.trim() || undefined,
    };
    try {
      const url = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(body?.errors?.nameAr?.[0] ?? body?.error ?? "فشل الحفظ");
      }
      toast.success(editing ? `تم تحديث «${payload.nameAr}» بنجاح` : `تم إضافة «${payload.nameAr}» بنجاح`);
      setOpen(false);
      await load();
    } catch (err) {
      toast.error((err as Error).message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, name?: string) {
    if (!confirm(`حذف المنتج ${name ?? ""}؟`)) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "تعذر الحذف");
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("تم حذف المنتج");
    } catch (err) {
      toast.error((err as Error).message || "تعذر الحذف");
    }
  }

  async function bulkApply() {
    if (!bulkAction || selectedIds.size === 0) {
      toast.error("اختر منتجات وإجراءً أولاً");
      return;
    }
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selectedIds), action: bulkAction, payload: {} }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error ?? "فشل الإجراء المجمع");
      toast.success(`تم تنفيذ الإجراء على ${selectedIds.size} منتج`);
      setSelectedIds(new Set());
      setBulkAction("");
      await load();
    } catch (err) {
      toast.error((err as Error).message || "فشل الإجراء المجمع");
    }
  }

  const productImage = (row: ProductRow) => row.image_url ?? row.media?.find((m) => m.is_primary)?.secure_url ?? "";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        {/* Toolbar: search + filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث عن منتج..." className="min-h-[44px] pr-9" aria-label="بحث في المنتجات" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="فلترة حسب القسم"
            className="h-[44px] rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">كل الأقسام</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ar}
              </option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            aria-label="فلترة حسب حالة المخزون"
            className="h-[44px] rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">كل حالات المخزون</option>
            <option value="in_stock">متوفر</option>
            <option value="low_stock">مخزون منخفض</option>
            <option value="out_of_stock">نفذت الكمية</option>
          </select>
          <Button size="sm" onClick={openCreate} className="min-h-[44px] gap-1.5">
            <Plus className="size-4" /> منتج جديد
          </Button>
        </div>

        {(categoryFilter !== "all" || stockFilter !== "all") && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">الفلاتر النشطة:</span>
            {categoryFilter !== "all" && (
              <button type="button" onClick={() => setCategoryFilter("all")} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold hover:bg-muted/70">
                {categories.find((c) => c.id === categoryFilter)?.name_ar ?? "قسم"} ✕
              </button>
            )}
            {stockFilter !== "all" && (
              <button type="button" onClick={() => setStockFilter("all")} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold hover:bg-muted/70">
                {STOCK_LABELS[stockFilter]} ✕
              </button>
            )}
          </div>
        )}

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
            <span className="text-sm font-semibold">تم اختيار {selectedIds.size} منتج</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              aria-label="إجراء مجمع"
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none"
            >
              <option value="">إجراء...</option>
              <option value="price_adjust">تعديل سعر</option>
              <option value="stock_update">تعديل مخزون</option>
              <option value="status_change">تغيير الحالة</option>
              <option value="delete">حذف</option>
            </select>
            <Button size="sm" onClick={bulkApply} className="min-h-[44px]">
              تنفيذ
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="min-h-[44px]">
              إلغاء التحديد
            </Button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Package className="size-10 text-muted-foreground/40" />
            <p className="font-semibold">{rows.length === 0 ? "لا توجد منتجات بعد." : "لا نتائج مطابقة للبحث أو الفلاتر."}</p>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" /> إضافة أول منتج
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-right text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="rounded-r-lg p-3">
                      <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleAll} aria-label="تحديد الكل" className="size-4 accent-[var(--color-primary)]" />
                    </th>
                    <th className="p-3 font-semibold">المنتج</th>
                    <th className="p-3 font-semibold">القسم</th>
                    <th className="p-3 font-semibold">السعر</th>
                    <th className="p-3 font-semibold">المخزون</th>
                    <th className="p-3 font-semibold">الحالة</th>
                    <th className="rounded-l-lg p-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const st = stockStatus(row);
                    return (
                      <tr key={row.id} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                        <td className="p-3">
                          <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} aria-label={`تحديد ${row.name_ar}`} className="size-4 accent-[var(--color-primary)]" />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {productImage(row) ? (
                              <ClientImage src={productImage(row)!} alt={row.name_ar ?? ""} className="size-10 shrink-0 rounded-lg" />
                            ) : (
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">{(row.name_ar ?? "?").slice(0, 1)}</div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{row.name_ar}</p>
                              {row.brand && <p className="truncate text-xs text-muted-foreground">{row.brand}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{row.category_name ?? "—"}</td>
                        <td className="p-3 font-semibold tabular-nums">{Number(row.price ?? 0).toLocaleString("ar-EG")} ج.م</td>
                        <td className="p-3 tabular-nums">{row.stock}</td>
                        <td className="p-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STOCK_CLASSES[st]}`}>{STOCK_LABELS[st]}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={`تعديل ${row.name_ar}`}>
                              <Edit3 className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => remove(row.id, row.name_ar)} className="min-h-[44px] min-w-[44px] text-destructive hover:bg-destructive/10" aria-label={`حذف ${row.name_ar}`}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <ul className="flex flex-col gap-3 lg:hidden">
              {filtered.map((row) => {
                const st = stockStatus(row);
                return (
                  <li key={row.id}>
                    <div className="flex items-start gap-3 rounded-xl border border-border p-3.5">
                      <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} aria-label={`تحديد ${row.name_ar}`} className="mt-1 size-5 shrink-0 accent-[var(--color-primary)]" />
                      {productImage(row) ? (
                        <ClientImage src={productImage(row)!} alt={row.name_ar ?? ""} className="size-12 shrink-0 rounded-lg" />
                      ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">{(row.name_ar ?? "?").slice(0, 1)}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{row.name_ar}</p>
                        <p className="text-xs text-muted-foreground">{row.category_name ?? "بدون قسم"} • {row.stock ?? 0} {row.unit ?? ""}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="font-bold tabular-nums text-primary">{Number(row.price ?? 0).toLocaleString("ar-EG")} ج.م</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STOCK_CLASSES[st]}`}>{STOCK_LABELS[st]}</span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button variant="outline" size="sm" className="min-h-[40px]" onClick={() => openEdit(row)}>
                            <Edit3 className="size-4" /> تعديل
                          </Button>
                          <Button variant="outline" size="sm" className="min-h-[40px] text-destructive hover:bg-destructive/10" onClick={() => remove(row.id, row.name_ar)}>
                            <Trash2 className="size-4" /> حذف
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* Create / edit dialog */}
        <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? `تعديل: ${editing.name_ar}` : "منتج جديد"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pf-name-ar">اسم المنتج (عربي) *</Label>
                  <Input id="pf-name-ar" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="min-h-[44px]" placeholder="زيت عافية ٢ لتر" aria-invalid={Boolean(formErrors.name_ar)} />
                  {formErrors.name_ar && <p className="text-xs text-destructive">{formErrors.name_ar}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pf-name-en">اسم المنتج (إنجليزي)</Label>
                  <Input id="pf-name-en" dir="ltr" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="min-h-[44px]" placeholder="Optional English name" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pf-price">سعر البيع (ج.م) *</Label>
                  <Input id="pf-price" type="number" min={0} step="0.25" inputMode="decimal" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })} className="min-h-[44px]" aria-invalid={Boolean(formErrors.price)} />
                  {formErrors.price && <p className="text-xs text-destructive">{formErrors.price}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pf-wholesale">سعر الجملة</Label>
                  <Input id="pf-wholesale" type="number" min={0} step="0.25" inputMode="decimal" value={form.wholesale_price || ""} onChange={(e) => setForm({ ...form, wholesale_price: Number(e.target.value) || 0 })} className="min-h-[44px]" aria-invalid={Boolean(formErrors.wholesale_price)} />
                  {formErrors.wholesale_price && <p className="text-xs text-destructive">{formErrors.wholesale_price}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pf-stock">المخزون *</Label>
                  <Input id="pf-stock" type="number" min={0} inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: Math.max(0, Number(e.target.value) || 0) })} className="min-h-[44px]" aria-invalid={Boolean(formErrors.stock)} />
                  {formErrors.stock && <p className="text-xs text-destructive">{formErrors.stock}</p>}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pf-unit">الوحدة *</Label>
                  <select id="pf-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="h-[44px] w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  {formErrors.unit && <p className="text-xs text-destructive">{formErrors.unit}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pf-category">القسم</Label>
                  <select id="pf-category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="h-[44px] w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">— بدون قسم —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pf-brand">الماركة</Label>
                  <Input id="pf-brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="min-h-[44px]" placeholder="اختياري" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pf-desc">الوصف</Label>
                <Textarea id="pf-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف يظهر للعميل في صفحة المنتج…" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="min-h-[44px] gap-1.5">
                <X className="size-4" /> إلغاء
              </Button>
              <Button onClick={save} disabled={saving} className="min-h-[44px]">
                {saving && <Loader2 className="size-4 animate-spin" />}
                حفظ المنتج
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
