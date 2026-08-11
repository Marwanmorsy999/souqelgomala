"use client";

import { useEffect, useState } from "react";
import { Edit3, Plus, Search, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ImageUploader,
  type CloudinaryUploadData,
} from "@/components/admin/image-uploader";
import { ClientImage } from "@/components/ui/client-image";
import { runAfterRender } from "@/components/admin/use-deferred-load";
import { useToast } from "@/components/ui/toast";

type CategoryRow = {
  id: string;
  name_ar: string;
  name_en?: string | null;
  parent_id?: string | null;
  image?: string | null;
  is_visible?: boolean;
  sort_order?: number;
};

const TOP_LEVEL_ID = "";

export function CategoriesManagement() {
  const toast = useToast();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      const body = await res.json();
      setRows(Array.isArray(body?.data) ? body.data : []);
    } catch {
      setError("تعذر تحميل الأقسام");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return runAfterRender(load);
  }, []);

  const filtered = query.trim()
    ? rows.filter((r) =>
        r.name_ar.toLowerCase().includes(query.trim().toLowerCase())
      )
    : rows;

  async function remove(row: CategoryRow) {
    if (!confirm(`حذف "${row.name_ar}"؟`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${row.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("تم حذف القسم");
        load();
      } else {
        toast.error("تعذر حذف القسم");
      }
    } catch {
      toast.error("تعذر حذف القسم");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث عن قسم…"
            className="pr-9"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="size-4" /> قسم جديد
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
            <p className="p-10 text-center text-muted-foreground">
              لا توجد أقسام. اضغط &quot;قسم جديد&quot; لإضافة أول قسم.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3 font-semibold">الصورة</th>
                    <th className="p-3 font-semibold">الاسم</th>
                    <th className="p-3 font-semibold">الاسم (EN)</th>
                    <th className="p-3 font-semibold">الحالة</th>
                    <th className="p-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="p-3">
                        <ClientImage
                          src={r.image || ""}
                          alt={r.name_ar}
                          className="size-12 rounded-full"
                          imgClassName="size-full object-cover"
                        />
                      </td>
                      <td className="p-3 font-bold">{r.name_ar}</td>
                      <td className="p-3 text-muted-foreground" dir="ltr">
                        {r.name_en || "—"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            r.is_visible === false
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {r.is_visible === false ? "مخفي" : "ظاهر"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(r);
                              setOpen(true);
                            }}
                            aria-label="تعديل"
                          >
                            <Edit3 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(r)}
                            aria-label="حذف"
                          >
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

      <CategoryDialog
        key={editing?.id ?? "new"}
        open={open}
        row={editing}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}

function CategoryDialog({
  open,
  row,
  onClose,
  onSaved,
}: {
  open: boolean;
  row: CategoryRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [nameAr, setNameAr] = useState(row?.name_ar ?? "");
  const [nameEn, setNameEn] = useState(row?.name_en ?? "");
  const [imageUrl, setImageUrl] = useState(row?.image ?? "");
  const [cloudinaryData, setCloudinaryData] =
    useState<CloudinaryUploadData | null>(null);
  const [parentId, setParentId] = useState(row?.parent_id ?? "");
  const [visible, setVisible] = useState(row?.is_visible !== false);
  const [parents, setParents] = useState<CategoryRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setNameAr(row?.name_ar ?? "");
      setNameEn(row?.name_en ?? "");
      setParentId(row?.parent_id ?? "");
      setImageUrl(row?.image ?? "");
      setCloudinaryData(null);
      setVisible(row?.is_visible !== false);
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, row]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch("/api/admin/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => {
        if (!active) return;
        const list = Array.isArray(b?.data) ? b.data : [];
        // Only top-level categories can be parents; exclude self.
        setParents(list.filter((c: CategoryRow) => !c.parent_id && c.id !== row?.id));
      })
      .catch(() => active && setParents([]));
    return () => {
      active = false;
    };
  }, [open, row?.id]);

  async function save() {
    if (!nameAr.trim()) {
      setError("اسم القسم مطلوب");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim() || undefined,
      parentId: parentId || null,
      image: imageUrl || undefined,
      isVisible: visible,
    };

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
          });

      const body = await res.json();
      if (!res.ok || !body?.success) {
        setError(body?.error ?? "تعذر الحفظ");
        return;
      }

      // Get the category ID
      const categoryId = row?.id ?? body?.data?.id;
      if (!categoryId) {
        setError("تم حفظ القسم ولكن تعذر تحديد المعرف");
        return;
      }

      // Attach category media if we have Cloudinary upload data
      if (cloudinaryData?.cloudinaryPublicId) {
        const mediaRes = await fetch("/api/admin/categories/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId,
            media: {
              cloudinaryPublicId: cloudinaryData.cloudinaryPublicId,
              secureUrl: cloudinaryData.secureUrl,
              width: cloudinaryData.width,
              height: cloudinaryData.height,
              format: cloudinaryData.format,
              isPrimary: true,
              displayOrder: 0,
            },
          }),
        });

        if (!mediaRes.ok) {
          const mediaBody = await mediaRes.json().catch(() => ({}));
          toast.error(
            "تم حفظ القسم ولكن فشل حفظ الصورة: " +
              (mediaBody?.error ?? "خطأ غير معروف")
          );
          onSaved();
          return;
        }
      }

      toast.success(row ? "تم تحديث القسم" : "تم إنشاء القسم");
      onSaved();
    } catch {
      setError("تعذر الحفظ — تحقق من الاتصال");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{row ? "تعديل قسم" : "قسم جديد"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="cNameAr">
                اسم القسم (عربي){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cNameAr"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: الأرز والسكر"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="cNameEn">الاسم (إنجليزي)</Label>
              <Input
                id="cNameEn"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Rice & Sugar"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="cParent">القسم الأب</Label>
            <select
              id="cParent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="h-9 rounded-lg border border-input bg-muted/60 px-2 text-sm outline-none focus:border-primary"
            >
              <option value={TOP_LEVEL_ID}>— قسم رئيسي —</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_ar}
                </option>
              ))}
            </select>
          </div>

          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            onCloudinaryData={setCloudinaryData}
            label="صورة القسم"
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="size-4 rounded"
            />
            ظاهر في المتجر
          </label>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
              {error}
            </p>
          )}
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
