"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bike,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  UserRound,
  Phone,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

type DriverStatus = "available" | "busy" | "offline";

type Driver = {
  id: string;
  name: string;
  phone: string;
  vehicle: string | null;
  status: DriverStatus;
  activeOrdersCount: number;
};

const STATUS_LABELS: Record<DriverStatus, string> = {
  available: "متاح",
  busy: "مشغول",
  offline: "خارج الخدمة",
};

const STATUS_CLASSES: Record<DriverStatus, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300",
  busy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
  offline: "bg-muted text-muted-foreground",
};

interface DriverFormState {
  name: string;
  phone: string;
  vehicle: string;
  status: DriverStatus;
}

const EMPTY_FORM: DriverFormState = { name: "", phone: "", vehicle: "", status: "available" };

export function DriversManagement() {
  const toast = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<DriverFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delivery/drivers", { cache: "no-store" });
      const body = await res.json();
      if (!body?.success) throw new Error(body?.error ?? "");
      setDrivers(Array.isArray(body.data) ? body.data : []);
    } catch {
      toast.error("تعذر تحميل المناديب");
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

  function openEdit(driver: Driver) {
    setEditing(driver);
    setForm({ name: driver.name, phone: driver.phone, vehicle: driver.vehicle ?? "", status: driver.status });
    setErrors({});
    setOpen(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "اسم المندوب مطلوب";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) e.phone = "رقم هاتف غير صالح (١٠-١٥ رقم)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/admin/delivery/drivers/${editing.id}` : "/api/admin/delivery/drivers";
      const method = editing ? "PATCH" : "POST";
      const payload = { name: form.name.trim(), phone: form.phone.trim(), vehicle: form.vehicle.trim(), status: form.status };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "فشل الحفظ");
      toast.success(editing ? `تم تحديث «${form.name}»` : `تم إضافة المندوب «${form.name}» بنجاح`);
      setOpen(false);
      await load();
    } catch (err) {
      toast.error((err as Error).message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function cycleStatus(driver: Driver) {
    // available → busy → offline → available
    const order: DriverStatus[] = ["available", "busy", "offline"];
    const next = order[(order.indexOf(driver.status) + 1) % order.length];
    try {
      const res = await fetch(`/api/admin/delivery/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "");
      setDrivers((prev) => prev.map((d) => (d.id === driver.id ? { ...d, status: next } : d)));
      toast.success(`حالة «${driver.name}»: ${STATUS_LABELS[next]}`);
    } catch {
      toast.error("تعذر تحديث حالة المندوب");
    }
  }

  async function remove(driver: Driver) {
    if (!confirm(`حذف المندوب ${driver.name}؟`)) return;
    try {
      const res = await fetch(`/api/admin/delivery/drivers/${driver.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "تعذر الحذف");
      setDrivers((prev) => prev.filter((d) => d.id !== driver.id));
      toast.success(`تم حذف المندوب ${driver.name}`);
    } catch (err) {
      toast.error((err as Error).message || "تعذر الحذف");
    }
  }

  const stats = useMemo(
    () => ({
      total: drivers.length,
      available: drivers.filter((d) => d.status === "available").length,
      busyOrders: drivers.reduce((sum, d) => sum + d.activeOrdersCount, 0),
    }),
    [drivers],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-muted px-3 py-1.5 font-semibold">{stats.total} مندوب</span>
          <span className="rounded-full bg-green-100 px-3 py-1.5 font-bold text-green-800 dark:bg-green-950/60 dark:text-green-300">{stats.available} متاح الآن</span>
          <span className="rounded-full bg-blue-100 px-3 py-1.5 font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">{stats.busyOrders} طلب موكّل</span>
        </div>
        <Button onClick={openCreate} className="min-h-[44px] gap-1.5">
          <Plus className="size-4" /> مندوب جديد
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <UserRound className="size-10 text-muted-foreground/40" />
            <div>
              <p className="font-semibold">لا يوجد مناديب بعد.</p>
              <p className="text-sm text-muted-foreground">أضف أول مندوب ليبدأ في استلام الطلبات.</p>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" /> إضافة مندوب
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {drivers.map((driver) => (
            <Card key={driver.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bike className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-black">{driver.name}</p>
                      <p dir="ltr" className="truncate text-xs text-muted-foreground">{driver.phone}</p>
                    </div>
                  </div>
                  {/* Tap-to-cycle status chip (visual zone assignment indicator) */}
                  <button
                    type="button"
                    onClick={() => cycleStatus(driver)}
                    title="اضغط لتغيير الحالة"
                    aria-label={`تغيير حالة ${driver.name}`}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold transition-opacity hover:opacity-80 ${STATUS_CLASSES[driver.status]}`}
                  >
                    {STATUS_LABELS[driver.status]}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {driver.vehicle && (
                    <span className="inline-flex items-center gap-1">
                      <Bike className="size-3.5" />
                      {driver.vehicle}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Package className="size-3.5" />
                    {driver.activeOrdersCount} طلب حالي
                  </span>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2 border-t pt-3">
                  <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => openEdit(driver)}>
                    <Edit3 className="size-4" /> تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] text-destructive hover:bg-destructive/10"
                    onClick={() => remove(driver)}
                  >
                    <Trash2 className="size-4" /> حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `تعديل: ${editing.name}` : "مندوب جديد"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dr-name">الاسم *</Label>
              <Input id="dr-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="min-h-[44px]" placeholder="مثال: أحمد سيد" aria-invalid={Boolean(errors.name)} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dr-phone">رقم الهاتف *</Label>
              <Input id="dr-phone" dir="ltr" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="min-h-[44px]" placeholder="01xxxxxxxxx" aria-invalid={Boolean(errors.phone)} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dr-vehicle">وسيلة النقل</Label>
              <Input id="dr-vehicle" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} className="min-h-[44px]" placeholder="مثال: موتوسيكل — أبيض" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dr-status">الحالة</Label>
              <select
                id="dr-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })}
                className="h-[44px] w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(Object.keys(STATUS_LABELS) as DriverStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            {!editing && (
              <p className="flex items-center gap-1.5 rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">
                <Phone className="size-3.5 shrink-0" />
                سيظهر المندوب فوراً في قائمة التكليف بالطلبات.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="min-h-[44px]">
              إلغاء
            </Button>
            <Button onClick={save} disabled={saving} className="min-h-[44px]">
              {saving && <Loader2 className="size-4 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
