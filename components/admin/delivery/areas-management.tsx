"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  Package,
  Wallet,
  Power,
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

type Area = {
  id: string;
  name: string;
  city: string;
  fee: number;
  minOrder: number;
  isActive: boolean;
  ordersCount: number;
};

interface AreaFormState {
  name: string;
  city: string;
  fee: number;
  minOrder: number;
}

const EMPTY_FORM: AreaFormState = { name: "", city: "", fee: 0, minOrder: 0 };

export function AreasManagement() {
  const toast = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cityFilter, setCityFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [form, setForm] = useState<AreaFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delivery/areas", { cache: "no-store" });
      const body = await res.json();
      if (!body?.success) throw new Error(body?.error ?? "");
      setAreas(Array.isArray(body.data) ? body.data : []);
    } catch {
      toast.error("تعذر تحميل مناطق التوصيل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return runAfterRender(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cities = useMemo(() => Array.from(new Set(areas.map((a) => a.city))), [areas]);
  const filteredAreas = cityFilter === "all" ? areas : areas.filter((a) => a.city === cityFilter);

  /** Zones grouped by city — the visual map of coverage. */
  const groupedByCity = useMemo(() => {
    const groups = new Map<string, Area[]>();
    for (const area of filteredAreas) {
      const list = groups.get(area.city) ?? [];
      list.push(area);
      groups.set(area.city, list);
    }
    return Array.from(groups.entries());
  }, [filteredAreas]);

  function openCreate(city = "") {
    setEditing(null);
    setForm({ ...EMPTY_FORM, city });
    setErrors({});
    setOpen(true);
  }

  function openEdit(area: Area) {
    setEditing(area);
    setForm({ name: area.name, city: area.city, fee: area.fee, minOrder: area.minOrder });
    setErrors({});
    setOpen(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "اسم المنطقة مطلوب";
    if (!form.city.trim()) e.city = "المدينة مطلوبة";
    if (!(form.fee >= 0)) e.fee = "الرسوم لا تكون سالبة";
    if (!(form.minOrder >= 0)) e.minOrder = "الحد الأدنى لا يكون سالباً";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/admin/delivery/areas/${editing.id}` : "/api/admin/delivery/areas";
      const method = editing ? "PATCH" : "POST";
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        fee: form.fee,
        minOrder: form.minOrder,
        ...(editing === null ? { isActive: true } : {}),
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "فشل الحفظ");
      toast.success(editing ? `تم تحديث منطقة «${form.name}»` : `تمت إضافة «${form.name}» لمناطق التوصيل`);
      setOpen(false);
      await load();
    } catch (err) {
      toast.error((err as Error).message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(area: Area) {
    try {
      const res = await fetch(`/api/admin/delivery/areas/${area.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !area.isActive }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "");
      setAreas((prev) => prev.map((a) => (a.id === area.id ? { ...a, isActive: !area.isActive } : a)));
      toast.success(!area.isActive ? `تم تفعيل توصيل «${area.name}»` : `تم إيقاف توصيل «${area.name}»`);
    } catch {
      toast.error("تعذر تحديث حالة المنطقة");
    }
  }

  async function remove(area: Area) {
    if (!confirm(`حذف منطقة ${area.name}؟`)) return;
    try {
      const res = await fetch(`/api/admin/delivery/areas/${area.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "تعذر الحذف");
      setAreas((prev) => prev.filter((a) => a.id !== area.id));
      toast.success(`تم حذف منطقة ${area.name}`);
    } catch (err) {
      toast.error((err as Error).message || "تعذر الحذف");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          aria-label="فلترة حسب المدينة"
          className="h-[44px] rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">كل المدن ({cities.length})</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button onClick={() => openCreate(cityFilter !== "all" ? cityFilter : "")} className="min-h-[44px] gap-1.5">
          <Plus className="size-4" /> منطقة جديدة
        </Button>
        <span className="mr-auto text-xs text-muted-foreground">{areas.filter((a) => a.isActive).length} منطقة نشطة من {areas.length}</span>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : areas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <MapPin className="size-10 text-muted-foreground/40" />
            <div>
              <p className="font-semibold">لا توجد مناطق توصيل بعد.</p>
              <p className="text-sm text-muted-foreground">حدد المناطق التي يغطيها المتجر ورسوم التوصيل لكل منها.</p>
            </div>
            <Button size="sm" onClick={() => openCreate()}>
              <Plus className="size-4" /> إضافة أول منطقة
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Visual zones grouped by city */
        <div className="flex flex-col gap-6">
          {groupedByCity.map(([city, list]) => (
            <section key={city}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-muted-foreground">
                <span className="inline-block size-2 rounded-full bg-primary" />
                {city}
                <span className="font-normal opacity-70">({list.length} {list.length === 1 ? "منطقة" : "مناطق"})</span>
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((area) => (
                  <li key={area.id}>
                    <Card className={`h-full transition-opacity ${!area.isActive && "opacity-60"}`}>
                      <CardContent className="flex flex-col gap-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <MapPin className={`size-5 shrink-0 ${area.isActive ? "text-primary" : "text-muted-foreground"}`} />
                            <p className="truncate font-black">{area.name}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleActive(area)}
                            aria-label={area.isActive ? `إيقاف توصيل ${area.name}` : `تفعيل توصيل ${area.name}`}
                            title={area.isActive ? "نشط — اضغط للإيقاف" : "متوقف — اضغط للتفعيل"}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              area.isActive ? "bg-green-600" : "bg-muted-foreground/30"
                            }`}
                          >
                            <span
                              className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                                area.isActive ? "-translate-x-[22px]" : "-translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <Wallet className="size-3.5" /> رسوم التوصيل
                            </p>
                            <p className="mt-0.5 font-black tabular-nums">{Number(area.fee).toLocaleString("ar-EG")} ج.م</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 px-2.5 py-2">
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <Package className="size-3.5" /> حد أدنى
                            </p>
                            <p className="mt-0.5 font-black tabular-nums">{Number(area.minOrder).toLocaleString("ar-EG")} ج.م</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{area.ordersCount} طلب في هذه المنطقة</p>

                        <div className="mt-auto grid grid-cols-2 gap-2 border-t pt-3">
                          <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => openEdit(area)}>
                            <Edit3 className="size-4" /> تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] text-destructive hover:bg-destructive/10"
                            onClick={() => remove(area)}
                          >
                            <Trash2 className="size-4" /> حذف
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `تعديل منطقة: ${editing.name}` : "منطقة توصيل جديدة"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ar-name">اسم المنطقة *</Label>
              <Input id="ar-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="min-h-[44px]" placeholder="مثال: المساكن" aria-invalid={Boolean(errors.name)} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ar-city">المدينة / المركز *</Label>
              <Input id="ar-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="min-h-[44px]" placeholder="مثال: كفر شكر" aria-invalid={Boolean(errors.city)} />
              {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ar-fee">رسوم التوصيل (ج.م)</Label>
                <Input id="ar-fee" type="number" min={0} step="0.5" inputMode="decimal" value={form.fee || ""} onChange={(e) => setForm({ ...form, fee: Math.max(0, Number(e.target.value) || 0) })} className="min-h-[44px]" aria-invalid={Boolean(errors.fee)} />
                {errors.fee && <p className="text-xs text-destructive">{errors.fee}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ar-min">أقل قيمة طلب</Label>
                <Input id="ar-min" type="number" min={0} inputMode="numeric" value={form.minOrder || ""} onChange={(e) => setForm({ ...form, minOrder: Math.max(0, Number(e.target.value) || 0) })} className="min-h-[44px]" aria-invalid={Boolean(errors.minOrder)} />
                {errors.minOrder && <p className="text-xs text-destructive">{errors.minOrder}</p>}
              </div>
            </div>
            <p className="flex items-start gap-1.5 rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">
              <Power className="mt-0.5 size-3.5 shrink-0" />
              المنطقة الجديدة تكون نشطة تلقائياً ويمكنك إيقافها في أي وقت بدون حذفها.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="min-h-[44px]">
              إلغاء
            </Button>
            <Button onClick={save} disabled={saving} className="min-h-[44px]">
              {saving && <Loader2 className="size-4 animate-spin" />}
              حفظ المنطقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
