"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  TrendingUp,
  ShoppingCart,
  ReceiptText,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/feedback/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { runAfterRender } from "@/components/admin/use-deferred-load";
import { useToast } from "@/components/ui/toast";

type ReportData = {
  periodDays: number;
  totals: { revenue: number; ordersCount: number; avgBasket: number };
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { productId?: string | null; name: string; quantity: number; revenue: number }[];
  lowStockWatchlist: { id: string; name: string; stock: number; threshold: number }[];
};

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  accepted: "مقبول",
  preparing: "قيد التجهيز",
  packed: "تم التغليف",
  out_for_delivery: "في الطريق",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

function formatEGP(value: number): string {
  return `${(Number(value) || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;
}

/** Download rows as an Excel-compatible CSV with an Arabic-safe UTF-8 BOM. */
function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const all = [header, ...rows];
  const csv =
    "\uFEFF" +
    all
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(","),
      )
      .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsView() {
  const toast = useToast();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/reports", { cache: "no-store" });
      const body = await res.json();
      if (!body?.success) throw new Error(body?.error ?? "");
      setData(body.data);
    } catch {
      toast.error("تعذر تحميل التقارير");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    return runAfterRender(() => load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasAnyOrders = useMemo(() => (data?.totals.ordersCount ?? 0) > 0, [data]);

  function exportSummary() {
    if (!data) return;
    try {
      downloadCsv(
        `report-summary-${new Date().toISOString().slice(0, 10)}.csv`,
        ["المؤشر", "القيمة"],
        [
          ["الفترة", `آخر ${data.periodDays} يوم`],
          ["إجمالي الإيرادات", data.totals.revenue],
          ["عدد الطلبات", data.totals.ordersCount],
          ["متوسط السلة", data.totals.avgBasket],
        ],
      );
      toast.success("تم تصدير الملخص بنجاح");
    } catch {
      toast.error("تعذر تصدير الملخص");
    }
  }

  function exportDaily() {
    if (!data) return;
    try {
      downloadCsv(
        `daily-revenue-${new Date().toISOString().slice(0, 10)}.csv`,
        ["التاريخ", "الإيرادات"],
        data.revenueByDay.map((d) => [d.date, d.revenue]),
      );
      toast.success("تم تصدير الإيرادات اليومية");
    } catch {
      toast.error("تعذر تصدير الملف");
    }
  }

  function exportTopProducts() {
    if (!data) return;
    try {
      downloadCsv(
        `top-products-${new Date().toISOString().slice(0, 10)}.csv`,
        ["المنتج", "الكمية المبيعة", "الإيرادات"],
        data.topProducts.map((p) => [p.name, p.quantity, p.revenue]),
      );
      toast.success("تم تصدير تقرير الأكثر مبيعاً");
    } catch {
      toast.error("تعذر تصدير الملف");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <div className="flex items-center justify-center gap-2 text-muted-foreground" role="status">
          <Loader2 className="size-5 animate-spin" />
          <span>جارٍ تحميل التقارير…</span>
        </div>
      </div>
    );
  }

  if (!data || !hasAnyOrders) {
    return (
      <Card>
        <CardContent className="p-8">
          <EmptyState
            icon={BarChart3}
            title="لا توجد بيانات كافية للتقارير بعد"
            description="ستظهر هنا إحصائيات المبيعات والمنتجات الأكثر مبيعاً بعد وصول أول الطلبات."
          />
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const kpis = [
    { label: "إيرادات الفترة", value: formatEGP(data.totals.revenue), icon: TrendingUp, color: "text-green-600 dark:text-green-400" },
    { label: "عدد الطلبات", value: String(data.totals.ordersCount), icon: ShoppingCart, color: "text-accent" },
    { label: "متوسط قيمة السلة", value: formatEGP(data.totals.avgBasket), icon: ReceiptText, color: "text-blue-600 dark:text-blue-400" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
          آخر {data.periodDays} يوم
        </span>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={exportDaily}>
            <FileSpreadsheet className="size-4" />
            تصدير يومي
          </Button>
          <Button variant="outline" size="sm" onClick={exportTopProducts}>
            <FileSpreadsheet className="size-4" />
            الأكثر مبيعاً
          </Button>
          <Button size="sm" onClick={exportSummary}>
            <FileSpreadsheet className="size-4" />
            تصدير الملخص
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="flex min-h-[44px] items-center gap-4 p-5">
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/40 ${k.color}`}>
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-black tabular-nums">{k.value}</p>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue chart */}
      <Card>
        <CardContent className="p-5 md:p-6">
          <h3 className="mb-4 text-lg font-black">الإيرادات اليومية</h3>
          <div dir="ltr" className="h-64 w-full md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueByDay} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary, #16a34a)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary, #16a34a)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => v.slice(5)}
                  interval={Math.ceil(data.revenueByDay.length / 10)}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={54} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <Tooltip
                  formatter={(value: unknown) => [formatEGP(Number(value ?? 0)), "الإيرادات"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border, #e5e7eb)", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary, #16a34a)" strokeWidth={2.5} fill="url(#reportGradient)" dot={false} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top products */}
        <Card>
          <CardContent className="p-5 md:p-6">
            <h3 className="mb-4 text-lg font-black">الأكثر مبيعاً</h3>
            {data.topProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">لا توجد مبيعات مسجلة في هذه الفترة.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {data.topProducts.map((p, i) => (
                  <li key={`${p.productId}-${p.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{p.quantity} وحدة</span>
                    <span className="hidden shrink-0 text-xs font-bold tabular-nums sm:block">{formatEGP(p.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {/* Orders by status */}
          <Card>
            <CardContent className="p-5 md:p-6">
              <h3 className="mb-4 text-lg font-black">الطلبات حسب الحالة</h3>
              <ul className="flex flex-wrap gap-2">
                {data.ordersByStatus.map((s) => (
                  <li key={s.status} className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    s.status === "delivered" ? "bg-primary/10 text-primary"
                      : s.status === "cancelled" ? "bg-destructive/10 text-destructive"
                        : s.status === "new" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-muted text-foreground"
                  }`}>
                    {STATUS_LABELS[s.status] ?? s.status}: {s.count}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Low stock watchlist */}
          <Card>
            <CardContent className="p-5 md:p-6">
              <h3 className="mb-1 flex items-center gap-2 text-lg font-black">
                <AlertTriangle className="size-5 text-yellow-600" />
                مراقبة المخزون المنخفض
              </h3>
              {data.lowStockWatchlist.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">كل المنتجات النشطة بمخزون جيد.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {data.lowStockWatchlist.slice(0, 8).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                      <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                        p.stock <= 0 ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300"
                      }`}>
                        {p.stock <= 0 ? "نفذت" : `${p.stock} متبقي`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
