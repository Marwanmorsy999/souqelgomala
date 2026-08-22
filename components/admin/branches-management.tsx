"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/feedback/skeleton";
import { runAfterRender } from "@/components/admin/use-deferred-load";
import { useToast } from "@/components/ui/toast";

type Branch = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  code: string | null;
  address: string | null;
  phone: string | null;
  mapsUrl: string | null;
  isActive: boolean;
};

interface BranchFormState {
  nameAr: string;
  nameEn: string;
  code: string;
  address: string;
  phone: string;
  mapsUrl: string;
}

const EMPTY_FORM: BranchFormState = { nameAr: "", nameEn: "", code: "", address: "", phone: "", mapsUrl: "" };

export function BranchesManagement() {
  const toast = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/branches", { cache: "no-store" });
      const body = await res.json();
      if (!body?.success) throw new Error(body?.error ?? "");
      setBranches(Array.isArray(body.data) ? body.data : []);
    } catch {
      toast.error("تعذر تحميل الفروع");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return runAfterRender(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setOpen(true);
  }

  function openEdit(branch: Branch) {
    setEditing(branch);
    setForm({
      nameAr: branch.nameAr,
      nameEn: branch.nameEn ?? "",
      code: branch.code ?? "",
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      mapsUrl: branch.mapsUrl ?? "",
    });
    setErrors({});
    setOpen(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nameAr.trim()) e.nameAr = "اسم الفرع مطلوب";
    if (form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 15) e.phone = "رقم هاتف غير صالح";
    }
    if (form.mapsUrl.trim() && !/^https?:\/\//i.test(form.mapsUrl.trim())) {
      e.mapsUrl = "الرابط يجب أن يبدأ بـ http أو https";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/admin/branches/${editing.id}` : "/api/admin/branches";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr: form.nameAr.trim(),
          nameEn: form.nameEn.trim(),
          code: form.code.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          mapsUrl: form.mapsUrl.trim(),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "فشل الحفظ");
      toast.success(editing ? `تم تحديث فرع «${form.nameAr}»` : `تمت إضافة فرع «${form.nameAr}» بنجاح`);
      setOpen(false);
      await load();
    } catch (err) {
      toast.error((err as Error).message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(branch: Branch) {
    try {
      const res = await fetch(`/api/admin/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !branch.isActive }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "");
      setBranches((prev) => prev.map((b) => (b.id === branch.id ? { ...b, isActive: !branch.isActive } : b)));
      toast.success(!branch.isActive ? `تم تفعيل فرع «${branch.nameAr}»` : `تم إيقاف فرع «${branch.nameAr}»`);
    } catch {
      toast.error("تعذر تحديث حالة الفرع");
    }
  }

  async function remove(branch: Branch) {
    if (!confirm(`حذف فرع ${branch.nameAr}؟`)) return;
    try {
      const res = await fetch(`/api/admin/branches/${branch.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "تعذر الحذف");
      setBranches((prev) => prev.filter((b) => b.id !== branch.id));
      toast.success(`تم حذف فرع ${branch.nameAr}`);
    } catch (err) {
      toast.error((err as Error).message || "تعذر الحذف");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {branches.filter((b) => b.isActive).length} فرع نشط من {branches.length}
        </span>
        <Button onClick={openCreate} className="min-h-[44px] gap-1.5">
          <Plus className="size-4" /> فرع جديد
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Building2 className="size-10 text-muted-foreground/40" />
            <div>
              <p className="font-semibold">لا توجد فروع بعد.</p>
              <p className="text-sm text-muted-foreground">أضف أول فرع ليظهر للعملاء في صفحة التواصل.</p>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" /> إضافة فرع
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className={!branch.isActive ? "opacity-70" : undefined}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-black">{branch.nameAr}</p>
                      {branch.code && <p className="font-mono text-xs text-muted-foreground">{branch.code}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(branch)}
                    aria-label={branch.isActive ? `إيقاف ${branch.nameAr}` : `تفعيل ${branch.nameAr}`}
                    title={branch.isActive ? "نشط — اضغط للإيقاف" : "متوقف — اضغط للتفعيل"}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      branch.isActive ? "bg-green-600" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                        branch.isActive ? "-translate-x-[22px]" : "-translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {branch.address && (
                    <span className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      {branch.address}
                    </span>
                  )}
                  {branch.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5 shrink-0" />
                      <span dir="ltr">{branch.phone}</span>
                    </span>
                  )}
                </div>

                <div className="mt-auto grid grid-cols-3 gap-1 border-t pt-3">
                  <Button variant="outline" size="sm" className="min-h-[40px]" onClick={() => openEdit(branch)} aria-label={`تعديل ${branch.nameAr}`}>
                    <Edit3 className="size-4" />
                    تعديل
                  </Button>
                  {branch.mapsUrl ? (
                    <Link href={branch.mapsUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm", className: "min-h-[40px]" })} aria-label={`خريطة ${branch.nameAr}`}>
                      <ExternalLink className="size-4" />
                      خريطة
                    </Link>
                  ) : (
                    <span />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[40px] text-destructive hover:bg-destructive/10"
                    onClick={() => remove(branch)}
                    aria-label={`حذف ${branch.nameAr}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `تعديل فرع: ${editing.nameAr}` : "فرع جديد"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="br-name-ar">اسم الفرع (عربي) *</Label>
                <Input id="br-name-ar" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="min-h-[44px]" placeholder="فرع كفر شكر" aria-invalid={Boolean(errors.nameAr)} />
                {errors.nameAr && <p className="text-xs text-destructive">{errors.nameAr}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="br-name-en">اسم الفرع (إنجليزي)</Label>
                <Input id="br-name-en" dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="min-h-[44px]" placeholder="Optional English name" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="br-code">كود الفرع</Label>
                <Input id="br-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="min-h-[44px]" placeholder="مثال: KS-01" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="br-phone">هاتف الفرع</Label>
                <Input id="br-phone" dir="ltr" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="min-h-[44px]" placeholder="01xxxxxxxxx" aria-invalid={Boolean(errors.phone)} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="br-address">العنوان</Label>
              <Input id="br-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="min-h-[44px]" placeholder="العنوان بالتفصيل…" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="br-maps">رابط خرائط جوجل</Label>
              <Input id="br-maps" dir="ltr" value={form.mapsUrl} onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })} className="min-h-[44px]" placeholder="https://maps.google.com/…" aria-invalid={Boolean(errors.mapsUrl)} />
              {errors.mapsUrl && <p className="text-xs text-destructive">{errors.mapsUrl}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="min-h-[44px]">
              إلغاء
            </Button>
            <Button onClick={save} disabled={saving} className="min-h-[44px]">
              {saving && <Loader2 className="size-4 animate-spin" />}
              حفظ الفرع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
