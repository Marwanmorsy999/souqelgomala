"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Loader2,
  Phone,
  MapPin,
  Plus,
  Trash2,
  X,
  ShoppingCart,
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/feedback/skeleton";
import { runAfterRender } from "@/components/admin/use-deferred-load";
import { useToast } from "@/components/ui/toast";

type OrderItem = {
  id: string;
  name_ar: string;
  name_en?: string | null;
  quantity: number;
  unit_price: number;
  total: number;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  status: string;
  total: number;
  created_at: string;
  items_count: number;
};

type OrderDetail = {
  order: OrderRow & { notes?: string | null; delivery_fee?: number; subtotal?: number; payment_method?: string | null };
  items: OrderItem[];
};

const STATUS_OPTIONS = [
  { value: "new", label: "جديد" },
  { value: "accepted", label: "مقبول" },
  { value: "preparing", label: "قيد التجهيز" },
  { value: "packed", label: "تم التغليف" },
  { value: "out_for_delivery", label: "في الطريق" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغي" },
];

function statusLabel(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

function statusClass(s: string) {
  if (s === "delivered") return "bg-primary/10 text-primary";
  if (s === "cancelled") return "bg-destructive/10 text-destructive";
  if (s === "new") return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
  return "bg-muted text-foreground";
}

function formatEGP(value: number): string {
  return `${(Number(value) || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;
}

/** Next logical status in the fulfillment flow — powers the one-tap advance button. */
const NEXT_STATUS: Record<string, string> = {
  new: "accepted",
  accepted: "preparing",
  preparing: "packed",
  packed: "out_for_delivery",
  out_for_delivery: "delivered",
};

function nextStatusLabel(s: string): string | null {
  const next = NEXT_STATUS[s];
  return next ? statusLabel(next) : null;
}

interface DraftItem {
  key: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

function newDraft(): DraftItem[] {
  return [{ key: Date.now(), name: "", quantity: 1, unitPrice: 0 }];
}

export function OrdersManagement() {
  const toast = useToast();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Create-order dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    notes: "",
    deliveryFee: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [draftItems, setDraftItems] = useState<DraftItem[]>(newDraft());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const body = await res.json();
      if (!body?.success) throw new Error(body?.error ?? "");
      setRows(Array.isArray(body?.data) ? body.data : []);
    } catch {
      setError("تعذر تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return runAfterRender(load);
  }, []);

  const filtered = useMemo(() => {
    let list = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.order_number.toLowerCase().includes(q) ||
          (r.customer_name ?? "").toLowerCase().includes(q) ||
          (r.customer_phone ?? "").includes(q),
      );
    }
    return list;
  }, [rows, statusFilter, query]);

  const newOrdersCount = rows.filter((r) => r.status === "new").length;

  async function openDetail(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" });
      const body = await res.json();
      if (body?.success && body.data) {
        setDetail(body.data);
        setDetailOpen(true);
      } else {
        toast.error(body?.error ?? "تعذر تحميل تفاصيل الطلب");
      }
    } catch {
      toast.error("تعذر تحميل تفاصيل الطلب");
    }
  }

  async function changeStatus(id: string, status: string) {
    const previous = detail?.order.status;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(body?.error ?? "تعذر تحديث حالة الطلب");
      }
      if (detail && detail.order.id === id) {
        const d = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" }).then((r) => r.json());
        if (d?.success) setDetail(d.data);
      }
      await load();
      toast.success(`تم تحديث حالة الطلب إلى «${statusLabel(status)}»`);
    } catch (err) {
      if (detail && previous) setDetail({ ...detail, order: { ...detail.order, status: previous } });
      toast.error((err as Error).message || "تعذر تحديث حالة الطلب");
    } finally {
      setSavingStatus(false);
    }
  }

  async function removeOrder(row: OrderRow) {
    if (!confirm(`حذف الطلب ${row.order_number}؟ يمكن استرجاعه من قاعدة البيانات.`)) return;
    try {
      const res = await fetch(`/api/admin/orders/${row.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw new Error(body?.error ?? "تعذر حذف الطلب");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast.success(`تم حذف الطلب ${row.order_number}`);
    } catch (err) {
      toast.error((err as Error).message || "تعذر حذف الطلب");
    }
  }

  function validateCreateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.customerName.trim()) errors.customerName = "اسم العميل مطلوب";
    const phoneDigits = form.customerPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) errors.customerPhone = "رقم هاتف غير صالح (١٠-١٥ رقم)";
    const validItems = draftItems.filter((i) => i.name.trim() && i.quantity > 0 && i.unitPrice >= 0);
    if (validItems.length === 0) errors.items = "أضف صنفاً واحداً على الأقل باسم وكمية صحيحة";
    if (form.deliveryFee < 0) errors.deliveryFee = "رسوم التوصيل لا تكون سالبة";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function createOrder() {
    if (!validateCreateForm()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: draftItems
            .filter((i) => i.name.trim())
            .map((i) => ({ name: i.name.trim(), quantity: i.quantity, unitPrice: i.unitPrice })),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new Error(body?.errors?.customerName?.[0] ?? body?.error ?? "تعذر إنشاء الطلب");
      }
      toast.success(`تم إنشاء الطلب ${body.data.orderNumber} بنجاح`);
      closeCreateDialog();
      await load();
    } catch (err) {
      toast.error((err as Error).message || "تعذر إنشاء الطلب");
    } finally {
      setCreating(false);
    }
  }

  function closeCreateDialog() {
    setCreateOpen(false);
    setForm({ customerName: "", customerPhone: "", customerAddress: "", notes: "", deliveryFee: 0 });
    setDraftItems(newDraft());
    setFormErrors({});
  }

  const draftTotal =
    draftItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0) + (form.deliveryFee || 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث برقم الطلب أو العميل أو الهاتف…"
            aria-label="بحث في الطلبات"
            className="min-h-[44px]"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="min-h-[44px] gap-1.5">
          <Plus className="size-4" />
          طلب جديد
        </Button>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} aria-label="تحديث القائمة">
          <Loader2 className={`size-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">تحديث</span>
        </Button>
      </div>

      {/* Status filter chips — the "N جديد" chip links straight to the filtered view */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {(["all", ...STATUS_OPTIONS.map((o) => o.value)] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
            style={{ minHeight: 36 }}
          >
            {s === "all" ? `الكل (${rows.length})` : statusLabel(s)}
            {s === "new" && newOrdersCount > 0 ? ` • ${newOrdersCount}` : ""}
          </button>
        ))}
      </div>

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!error &&
        (loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <ShoppingCart className="size-10 text-muted-foreground/40" />
              <p className="font-semibold">{rows.length === 0 ? "لا توجد طلبات بعد." : "لا نتائج مطابقة للفلتر الحالي."}</p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                إنشاء طلب يدوي
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop / Tablet table */}
            <Card className="hidden md:block">
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-right text-sm">
                  <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="rounded-r-lg p-3.5 font-semibold">رقم الطلب</th>
                      <th className="p-3.5 font-semibold">العميل</th>
                      <th className="p-3.5 font-semibold">الأصناف</th>
                      <th className="p-3.5 font-semibold">الإجمالي</th>
                      <th className="p-3.5 font-semibold">الحالة</th>
                      <th className="p-3.5 font-semibold">التاريخ</th>
                      <th className="rounded-l-lg p-3.5 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                        <td className="p-3.5 font-bold">{r.order_number}</td>
                        <td className="p-3.5">
                          <p>{r.customer_name ?? "—"}</p>
                          <p dir="ltr" className="text-xs text-muted-foreground">{r.customer_phone}</p>
                        </td>
                        <td className="p-3.5 text-muted-foreground">{r.items_count}</td>
                        <td className="p-3.5 font-semibold">{formatEGP(r.total)}</td>
                        <td className="p-3.5">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(r.status)}`}>
                            {statusLabel(r.status)}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openDetail(r.id)} aria-label={`تفاصيل الطلب ${r.order_number}`}>
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOrder(r)}
                              className="min-h-[44px] min-w-[44px] text-destructive hover:bg-destructive/10"
                              aria-label={`حذف الطلب ${r.order_number}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Mobile card view */}
            <ul className="flex flex-col gap-3 md:hidden">
              {filtered.map((r) => {
                const advance = nextStatusLabel(r.status);
                return (
                  <li key={r.id}>
                    <Card>
                      <CardContent className="flex flex-col gap-3 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{r.order_number}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(r.status)}`}>
                            {statusLabel(r.status)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{r.customer_name ?? "عميل"}</p>
                          <p dir="ltr" className="text-xs text-muted-foreground">{r.customer_phone ?? ""}</p>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2 text-sm">
                          <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ar-EG")}</span>
                          <span className="font-black text-primary">{formatEGP(r.total)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {advance ? (
                            <Button
                              size="sm"
                              className="min-h-[44px]"
                              disabled={savingStatus}
                              onClick={() => changeStatus(r.id, NEXT_STATUS[r.status])}
                            >
                              {advance}
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" className="min-h-[44px]" disabled>
                              مكتمل
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => openDetail(r.id)}>
                            <Eye className="size-4" />
                            تفاصيل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] text-destructive hover:bg-destructive/10"
                            onClick={() => removeOrder(r)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        ))}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={(o) => !o && setDetailOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب {detail?.order.order_number}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0 text-primary" />
                  <span dir="ltr">{detail.order.customer_phone ?? "—"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{detail.order.customer_address ?? "—"}</span>
                </div>
                {detail.order.notes && <p className="text-xs text-muted-foreground">ملاحظات: {detail.order.notes}</p>}
              </div>

              <div className="flex flex-col gap-2">
                {detail.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0">
                    <span className="font-bold">{it.name_ar}</span>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {it.quantity} × {it.unit_price.toLocaleString("ar-EG")} = {(it.unit_price * it.quantity).toLocaleString("ar-EG")} ج.م
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المنتجات</span>
                  <span>{formatEGP(detail.order.subtotal ?? detail.order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التوصيل</span>
                  <span>{formatEGP(detail.order.delivery_fee ?? 0)}</span>
                </div>
                <div className="flex justify-between text-base font-black">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatEGP(detail.order.total)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="order-status">تحديث الحالة</Label>
                <select
                  id="order-status"
                  value={detail.order.status}
                  disabled={savingStatus}
                  onChange={(e) => changeStatus(detail.order.id, e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create manual order dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && closeCreateDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>إنشاء طلب يدوي (تليفون / حضوري)</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="co-name">اسم العميل *</Label>
                <Input
                  id="co-name"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="min-h-[44px]"
                  placeholder="محمد أحمد"
                  aria-invalid={Boolean(formErrors.customerName)}
                />
                {formErrors.customerName && <p className="text-xs text-destructive">{formErrors.customerName}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="co-phone">رقم الهاتف *</Label>
                <Input
                  id="co-phone"
                  dir="ltr"
                  type="tel"
                  inputMode="tel"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="min-h-[44px]"
                  placeholder="01xxxxxxxxx"
                  aria-invalid={Boolean(formErrors.customerPhone)}
                />
                {formErrors.customerPhone && <p className="text-xs text-destructive">{formErrors.customerPhone}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-address">عنوان التوصيل</Label>
              <Input
                id="co-address"
                value={form.customerAddress}
                onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                className="min-h-[44px]"
                placeholder="العنوان بالتفصيل…"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>الأصناف *</Label>
              {formErrors.items && <p className="text-xs text-destructive">{formErrors.items}</p>}
              {draftItems.map((item, idx) => (
                <div key={item.key} className="grid grid-cols-[1fr_72px_92px_40px] items-center gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      setDraftItems((prev) => prev.map((it) => (it.key === item.key ? { ...it, name: e.target.value } : it)))
                    }
                    className="min-h-[44px]"
                    placeholder={idx === 0 ? "اسم الصنف…" : ""}
                    aria-label={`اسم الصنف ${idx + 1}`}
                  />
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={(e) =>
                      setDraftItems((prev) =>
                        prev.map((it) => (it.key === item.key ? { ...it, quantity: Math.max(1, Number(e.target.value) || 1) } : it)),
                      )
                    }
                    className="min-h-[44px]"
                    aria-label={`كمية الصنف ${idx + 1}`}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.25"
                    inputMode="decimal"
                    value={item.unitPrice}
                    onChange={(e) =>
                      setDraftItems((prev) =>
                        prev.map((it) => (it.key === item.key ? { ...it, unitPrice: Math.max(0, Number(e.target.value) || 0) } : it)),
                      )
                    }
                    className="min-h-[44px]"
                    aria-label={`سعر الصنف ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px]"
                    onClick={() => setDraftItems((prev) => prev.filter((it) => it.key !== item.key))}
                    aria-label={`إزالة الصنف ${idx + 1}`}
                    disabled={draftItems.length === 1}
                  >
                    <X className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDraftItems((prev) => [...prev, { key: Date.now(), name: "", quantity: 1, unitPrice: 0 }])}
                className="self-start"
              >
                <Plus className="size-4" />
                إضافة صنف
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="co-fee">رسوم التوصيل (ج.م)</Label>
                <Input
                  id="co-fee"
                  type="number"
                  min={0}
                  step="0.5"
                  inputMode="decimal"
                  value={form.deliveryFee}
                  onChange={(e) => setForm({ ...form, deliveryFee: Math.max(0, Number(e.target.value) || 0) })}
                  className="min-h-[44px]"
                />
              </div>
              <div className="flex flex-col justify-end">
                <p className="text-xs font-semibold text-muted-foreground">الإجمالي المتوقع</p>
                <p className="text-lg font-black tabular-nums text-primary">{formatEGP(draftTotal)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-notes">ملاحظات</Label>
              <Textarea
                id="co-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="اختياري…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeCreateDialog} className="min-h-[44px] gap-1.5">
              <X className="size-4" /> إلغاء
            </Button>
            <Button onClick={createOrder} disabled={creating} className="min-h-[44px]">
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              إنشاء الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
