"use client";

import { useEffect, useState } from "react";
import { Eye, Loader2, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { runAfterRender } from "@/components/admin/use-deferred-load";

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
  if (s === "new") return "bg-accent/20 text-accent-foreground";
  return "bg-muted text-foreground";
}

export function OrdersManagement() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const body = await res.json();
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

  const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);

  async function openDetail(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" });
      const body = await res.json();
      if (body?.success && body.data) {
        setDetail(body.data);
        setDetailOpen(true);
      }
    } catch {
      setError("تعذر تحميل تفاصيل الطلب");
    }
  }

  async function changeStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      if (detail) {
        const d = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" }).then((r) => r.json());
        if (d?.success) setDetail(d.data);
      }
      load();
    } else {
      setError("تعذر تحديث حالة الطلب");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {["all", ...STATUS_OPTIONS.map((o) => o.value)].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {s === "all" ? "الكل" : statusLabel(s)}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> جارٍ التحميل…
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground">لا توجد طلبات بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3 font-semibold">رقم الطلب</th>
                    <th className="p-3 font-semibold">العميل</th>
                    <th className="p-3 font-semibold">الأصناف</th>
                    <th className="p-3 font-semibold">الإجمالي</th>
                    <th className="p-3 font-semibold">الحالة</th>
                    <th className="p-3 font-semibold">التاريخ</th>
                    <th className="p-3 font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="p-3 font-bold">{r.order_number}</td>
                      <td className="p-3">{r.customer_name ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{r.items_count}</td>
                      <td className="p-3 font-semibold">{r.total} ج.م</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("ar-EG")}
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="icon" onClick={() => openDetail(r.id)} aria-label="تفاصيل">
                          <Eye className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={(o) => !o && setDetailOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب {detail?.order.order_number}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-primary" />
                  {detail.order.customer_phone ?? "—"}
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  {detail.order.customer_address ?? "—"}
                </div>
                {detail.order.notes && <p className="text-muted-foreground">ملاحظات: {detail.order.notes}</p>}
              </div>

              <div className="flex flex-col gap-2">
                {detail.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between border-b pb-2 text-sm">
                    <span className="font-bold">{it.name_ar}</span>
                    <span className="text-muted-foreground">
                      {it.quantity} × {it.unit_price} = {it.total} ج.م
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المنتجات</span>
                  <span>{detail.order.subtotal ?? detail.order.total} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التوصيل</span>
                  <span>{detail.order.delivery_fee ?? 0} ج.م</span>
                </div>
                <div className="flex justify-between text-base font-black">
                  <span>الإجمالي</span>
                  <span className="text-primary">{detail.order.total} ج.م</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>تحديث الحالة</Label>
                <select
                  value={detail.order.status}
                  onChange={(e) => changeStatus(detail.order.id, e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground">{children}</p>;
}
