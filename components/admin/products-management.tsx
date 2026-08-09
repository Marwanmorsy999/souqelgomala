"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ClientImage } from "@/components/ui/client-image";
import { runAfterRender } from "@/components/admin/use-deferred-load";

type ProductRow = {
  id: string;
  name_ar?: string;
  name_en?: string;
  brand?: string | null;
  category_id?: string | null;
  price?: number;
  wholesale_price?: number | null;
  unit?: string;
  stock?: number;
  is_visible?: boolean;
  status?: string;
  image_url?: string;
  image?: string;
};

const UNITS = ["piece", "كيلو", "علبة", "عبوة", "رزمة", "طرد", "شوال", "كرتونة", "زجاجة", "كيس"];

export function ProductsManagement() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name_ar: string }[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [p, c] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/catalog/categories", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setRows(Array.isArray(p?.data) ? p.data : []);
      setCategories(
        (Array.isArray(c?.data) ? c.data : []).map((x: { id: string; name: string }) => ({
          id: x.id,
          name_ar: x.name,
        })),
      );
    } catch {
      setError("تعذر تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return runAfterRender(load);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.name_ar ?? "").toLowerCase().includes(q) ||
        (r.name_en ?? "").toLowerCase().includes(q) ||
        (r.brand ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(row: ProductRow) {
    setEditing(row);
    setOpen(true);
  }

  async function remove(row: ProductRow) {
    if (!confirm(`حذف "${row.name_ar ?? row.id}"؟`)) return;
    setError(null);
    const res = await fetch(`/api/admin/products?id=${row.id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("تعذر حذف المنتج");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث عن منتج…"
            className="pr-9"
          />
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" /> منتج جديد
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> جارٍ التحميل…
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground">لا توجد منتجات.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3 font-semibold">الصورة</th>
                    <th className="p-3 font-semibold">الاسم</th>
                    <th className="p-3 font-semibold">العلامة</th>
                    <th className="p-3 font-semibold">السعر</th>
                    <th className="p-3 font-semibold">جملة</th>
                    <th className="p-3 font-semibold">المخزون</th>
                    <th className="p-3 font-semibold">الحالة</th>
                    <th className="p-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="p-3">
                        <ClientImage
                          src={r.image_url || r.image || ""}
                          alt={r.name_ar ?? ""}
                          className="size-12 rounded-lg"
                          imgClassName="size-full object-cover"
                        />
                      </td>
                      <td className="p-3 font-bold">{r.name_ar}</td>
                      <td className="p-3 text-muted-foreground">{r.brand ?? "—"}</td>
                      <td className="p-3">{r.price} ج.م</td>
                      <td className="p-3">{r.wholesale_price ?? "—"}</td>
                      <td className="p-3">{r.stock ?? 0}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            r.is_visible === false || r.status === "inactive"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {r.is_visible === false || r.status === "inactive" ? "مخفي" : "ظاهر"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="تعديل">
                            <Edit3 className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(r)} aria-label="حذف">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDialog
        key={editing?.id ?? "new"}
        open={open}
        row={editing}
        categories={categories}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}

function ProductDialog({
  open,
  row,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  row: ProductRow | null;
  categories: { id: string; name_ar: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nameAr, setNameAr] = useState(row?.name_ar ?? "");
  const [nameEn, setNameEn] = useState(row?.name_en ?? "");
  const [brand, setBrand] = useState(row?.brand ?? "");
  const [categoryId, setCategoryId] = useState(row?.category_id ?? "");
  const [unit, setUnit] = useState(row?.unit ?? "piece");
  const [price, setPrice] = useState(String(row?.price ?? ""));
  const [wholesale, setWholesale] = useState(String(row?.wholesale_price ?? ""));
  const [stock, setStock] = useState(String(row?.stock ?? 0));
  const [image, setImage] = useState(row?.image_url || row?.image || "");
  const [visible, setVisible] = useState(row?.is_visible !== false && row?.status !== "inactive");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const payload = {
      nameAr: nameAr || "بدون اسم",
      nameEn: nameEn || undefined,
      brand: brand || undefined,
      categoryId: categoryId || undefined,
      unit: unit || "piece",
      price: Number(price) || 0,
      wholesalePrice: wholesale ? Number(wholesale) : undefined,
      stock: Number(stock) || 0,
      image: image || undefined,
      isVisible: visible,
    };
    try {
      const res = row
        ? await fetch(`/api/admin/products/${row.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        setError(body?.error ?? "تعذر الحفظ");
        return;
      }
      onSaved();
    } catch {
      setError("تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row ? "تعديل منتج" : "منتج جديد"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="nameAr">الاسم (عربي) *</Label>
              <Input id="nameAr" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="nameEn">الاسم (إنجليزي)</Label>
              <Input id="nameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="brand">العلامة التجارية</Label>
              <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="cat">القسم</Label>
              <select
                id="cat"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— بدون قسم —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="unit">الوحدة</Label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="stock">المخزون</Label>
              <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="price">سعر التجزئة (ج.م) *</Label>
              <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="ws">سعر الجملة (ج.م)</Label>
              <Input id="ws" type="number" value={wholesale} onChange={(e) => setWholesale(e.target.value)} />
            </div>
          </div>

          <ImageUploader value={image} onChange={setImage} label="صورة المنتج" />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            ظاهر في المتجر
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="gap-1.5">
            <X className="size-4" /> إلغاء
          </Button>
          <Button onClick={save} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="size-4 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
