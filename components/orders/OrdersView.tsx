"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock4,
  ClipboardList,
  MapPin,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { orders as defaultOrders } from "@/lib/data";
import { getProductsByIds } from "@/lib/services/catalog";
import { useStore } from "@/lib/store";
import type { Order, Product } from "@/lib/types";

function OrderStatusBadge({ status }: { status: Order["status"] }) {
  const config =
    status === "delivered"
      ? {
          label: "تم التسليم",
          className: "bg-primary/10 text-primary",
          icon: CheckCircle2,
        }
      : status === "preparing"
        ? {
            label: "جاري التجهيز",
            className: "bg-accent/20 text-accent-foreground",
            icon: Clock4,
          }
        : status === "on_delivery"
          ? {
              label: "في الطريق",
              className: "bg-blue-500/10 text-blue-600",
              icon: Clock4,
            }
          : {
              label: "ملغي",
              className: "bg-destructive/10 text-destructive",
              icon: Ban,
            };
  const Icon = config.icon;
  return (
    <Badge className={`gap-1 border-0 ${config.className}`}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}

function OrderDetails({
  order,
  productMap,
  onBack,
  onReorder,
  onCancel,
}: {
  order: Order;
  productMap: Record<string, Product>;
  onBack: () => void;
  onReorder: (o: Order) => void;
  onCancel: () => void;
}) {
  const steps = ["تم الطلب", "جاري التجهيز", "خرج للتوصيل", "تم التسليم"];
  const currentStep =
    order.status === "delivered"
      ? 4
      : order.status === "on_delivery"
        ? 3
        : order.status === "preparing"
          ? 2
          : 0;

  return (
    <main className="min-h-screen bg-background pb-28" dir="rtl">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-4 py-4 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronRight className="size-5" />
        </Button>
        <div className="text-center">
          <h1 className="font-black">تفاصيل الطلب</h1>
          <p className="text-xs text-muted-foreground">#{order.id}</p>
        </div>
        <span className="size-9" />
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5">
        {/* Status + stepper */}
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col gap-5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">حالة الطلب</p>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-sm text-muted-foreground">{order.date}</p>
            </div>
            <div className="flex items-start">
              {steps.map((step, i) => (
                <div
                  key={step}
                  className="relative flex flex-1 flex-col items-center gap-2 text-center"
                >
                  <div
                    className={`z-10 flex size-8 items-center justify-center rounded-full
                    ${i < currentStep ? "bg-primary text-primary-foreground" : i === currentStep - 1 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {i < currentStep ? (
                      <Check className="size-4" />
                    ) : (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {step}
                  </span>
                  {i < steps.length - 1 && (
                    <div
                      className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${i < currentStep - 1 ? "bg-primary" : "bg-border"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="rounded-3xl">
          <CardContent className="p-5">
            <h2 className="mb-3 font-black">عنوان التوصيل</h2>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="leading-6 text-muted-foreground">{order.address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col gap-3 p-5">
<h2 className="font-black">المنتجات</h2>
            {order.items.map((item) => {
              const product = productMap[item.id];
              if (!product) return null;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-14 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {product.retail} ج.م
                    </p>
                  </div>
                  <p className="font-bold">
                    {product.retail * item.quantity} ج.م
                  </p>
                </div>
              );
            })}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الإجمالي</span>
              <span className="text-lg font-black text-primary">
                {order.total} ج.م
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            className="h-12 flex-1 rounded-2xl"
            onClick={() => onReorder(order)}
          >
            <RotateCcw className="size-4" />
            إعادة الطلب
          </Button>
          {order.status === "preparing" && (
            <Button
              variant="outline"
              className="h-12 rounded-2xl text-destructive"
              onClick={onCancel}
            >
              إلغاء الطلب
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

type Props = { onBack: () => void };

export function OrdersView({ onBack }: Props) {
  const [orders, setOrders] = useState(defaultOrders);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const add = useStore((s) => s.add);

  useEffect(() => {
    let active = true;
    // Resolve only the products referenced by the orders (never the full catalog).
    const ids = [
      ...new Set(orders.flatMap((o) => o.items.map((i) => i.id))),
    ];
    if (ids.length === 0) return;
    getProductsByIds(ids)
      .then((list) => {
        if (!active) return;
        const map: Record<string, Product> = {};
        for (const p of list) map[p.id] = p;
        setProductMap(map);
      })
      .catch(() => {
        /* ignore catalog load failures */
      });
    return () => {
      active = false;
    };
  }, [orders]);

  const filtered = orders.filter(
    (o) => filter === "all" || o.status === filter,
  );

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      Array.from({ length: item.quantity }).forEach(() => add(item.id));
    });
    setSelected(null);
    onBack();
  };

  const handleCancel = (id: string) => {
    setOrders((curr) =>
      curr.map((o) =>
        o.id === id
          ? { ...o, status: "cancelled" as const, delivery: "تم الإلغاء" }
          : o,
      ),
    );
    setSelected(null);
  };

if (selected) {
    return (
      <OrderDetails
        order={selected}
        productMap={productMap}
        onBack={() => setSelected(null)}
        onReorder={handleReorder}
        onCancel={() => handleCancel(selected.id)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background pb-28" dir="rtl">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-4 py-4 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronRight className="size-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-black">طلباتي</h1>
          <p className="text-xs text-muted-foreground">تابع كل طلباتك بسهولة</p>
        </div>
        <ClipboardList className="size-5 text-primary" />
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5">
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {[
            ["all", "كل الطلبات"],
            ["preparing", "جاري التجهيز"],
            ["delivered", "تم التسليم"],
            ["cancelled", "ملغاة"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors
                ${filter === val ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-center">
            <PackageCheck className="size-14 text-muted-foreground/40" />
            <h2 className="text-xl font-black">لا توجد طلبات هنا</h2>
            <p className="text-sm text-muted-foreground">
              جرّب فلترًا مختلفًا لمشاهدة طلباتك.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((order) => (
              <Card key={order.id} className="rounded-3xl">
                <CardContent className="flex flex-col gap-4 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black">طلب #{order.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.date}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
<div className="flex -space-x-3 space-x-reverse">
                      {order.items.map((item) => {
                        const product = productMap[item.id];
                        if (!product) return null;
                        return (
                          <img
                            key={item.id}
                            src={product.image}
                            alt={product.name}
                            className="size-12 rounded-full border-2 border-card object-cover"
                          />
                        );
                      })}
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">الإجمالي</p>
                      <p className="text-lg font-black text-primary">
                        {order.total} ج.م
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} منتجات ·{" "}
                      {order.delivery}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setSelected(order)}
                    >
                      عرض التفاصيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
