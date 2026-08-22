"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound, MapPin, Truck, PackageCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/feedback/skeleton";
import { runAfterRender } from "@/components/admin/use-deferred-load";

type Summary = {
  driversTotal: number;
  driversAvailable: number;
  areasTotal: number;
  areasActive: number;
  outForDeliveryOrders: number;
};

export function DeliveryHub() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/delivery/summary", { cache: "no-store" });
      const body = await res.json();
      if (body?.success) setSummary(body.data);
      else throw new Error(body?.error ?? "");
    } catch {
      setError("تعذر تحميل ملخص التوصيل");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return runAfterRender(load);
  }, []);

  const cards = [
    {
      label: "مناديب",
      value: summary ? `${summary.driversAvailable} متاح من ${summary.driversTotal}` : "",
      icon: UserRound,
      href: "/admin/delivery/drivers",
      color: "text-primary",
    },
    {
      label: "مناطق توصيل",
      value: summary ? `${summary.areasActive} نشطة من ${summary.areasTotal}` : "",
      icon: MapPin,
      href: "/admin/delivery/areas",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "طلبات في الطريق",
      value: summary ? String(summary.outForDeliveryOrders) : "",
      icon: PackageCheck,
      href: "/admin/orders",
      color: "text-accent",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : (
        !error && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {cards.map((c) => {
                const Icon = c.icon;
                return (
                  <Link key={c.href + c.label} href={c.href} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Card className="transition-colors hover:border-primary/40 hover:bg-muted/20">
                      <CardContent className="flex min-h-[44px] items-center gap-4 p-5">
                        <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/40 ${c.color}`}>
                          <Icon className="size-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-lg font-black">{c.value || "—"}</p>
                          <p className="text-sm text-muted-foreground">{c.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <Card>
              <CardContent className="p-5 md:p-6">
                <h3 className="mb-1 flex items-center gap-2 text-lg font-black">
                  <Truck className="size-5 text-primary" />
                  إدارة التوصيل
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">اختر وحدة للإدارة السريعة</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/admin/delivery/drivers"
                    className="group flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <UserRound className="size-8 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-black">المناديب</p>
                      <p className="text-xs text-muted-foreground">إضافة وتعديل المناديب وحالاتهم (متاح / مشغول / خارج الخدمة)</p>
                    </div>
                  </Link>
                  <Link
                    href="/admin/delivery/areas"
                    className="group flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <MapPin className="size-8 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="min-w-0 flex-1">
                      <p className="font-black">مناطق التوصيل</p>
                      <p className="text-xs text-muted-foreground">تحديد المناطق المدعومة ورسوم التوصيل والحد الأدنى لكل منطقة</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground" role="status">
          <Loader2 className="size-5 animate-spin" />
          <span>جارٍ التحميل…</span>
        </div>
      )}
    </div>
  );
}
