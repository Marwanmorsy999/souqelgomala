"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight,
  MessageSquareText,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getProducts } from "@/lib/services/catalog";
import { formatPrice } from "@/lib/utils";
import { delivery as deliveryConfig } from "@/lib/site";
import type { CartItem, Product } from "@/lib/types";

type Props = {
  cart: CartItem[];
  total: number;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  onBack: () => void;
  onCheckout: () => void;
};

export function CartView({
  cart,
  total,
  increment,
  decrement,
  remove,
  clear,
  onBack,
  onCheckout,
}: Props) {
const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});

  useEffect(() => {
    let active = true;
    getProducts()
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
  }, []);

  const discount = couponApplied ? Math.round(total * 0.1 * 100) / 100 : 0;
  const delivery =
    total === 0 || total >= deliveryConfig.freeAbove ? 0 : deliveryConfig.fee;
  const grandTotal = total - discount + delivery;
  const remaining = Math.max(0, deliveryConfig.freeAbove - total);

    if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-bg-base pb-28" dir="rtl">
        <header className="flex items-center justify-between border-b border-border-subtle bg-bg-nav/95 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronRight className="size-5" />
          </Button>
          <h1 className="text-lg font-black">السلة</h1>
          <span className="size-9" />
        </header>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-8 text-center">
          <svg
            viewBox="0 0 180 140"
            className="size-40 text-brand-green/25"
            role="img"
            aria-label="سلة فارغة"
          >
            <path
              d="M28 39h124l-12 70H40L28 39Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinejoin="round"
            />
            <path
              d="M20 34h140M58 34 70 18m52 16-12-16M55 123h10m50 0h10"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="text-2xl font-black">السلة فاضية</h2>
          <p className="max-w-xs text-sm leading-6 text-text-secondary">
            اختار منتجاتك المفضلة من عروض سوق الجملة وابدأ طلبك.
          </p>
          <Button onClick={onBack} className="h-11 rounded-2xl px-8">
            ابدأ التسوق
          </Button>
        </div>
      </main>
    );
  }

    return (
    <main className="min-h-screen bg-bg-base pb-48" dir="rtl">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border-subtle bg-bg-nav/95 px-4 py-4 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronRight className="size-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-black">سلة المشتريات</h1>
          <p className="text-xs text-text-secondary">
            {cart.reduce((s, i) => s + i.quantity, 0)} قطع
          </p>
        </div>
        <Button
          variant="ghost"
          className="text-xs text-red-error"
          onClick={clear}
        >
          مسح الكل
        </Button>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4">
        {/* Free delivery progress */}
        <div className="flex items-center gap-2 rounded-lg border border-brand-green/30 bg-brand-green-dim px-3 py-3 text-xs font-bold text-brand-green-light">
          <Truck className="size-4 shrink-0" />
          {remaining > 0
            ? `أضف ${remaining} ج.م واحصل على توصيل مجاني`
            : "مبروك! التوصيل المجاني متاح لطلبك 🎉"}
        </div>

        {/* Items */}
        <section className="flex flex-col gap-3">
{cart.map((item) => {
            const product = productMap[item.id];
            if (!product) return null;
            return (
              <motion.div
                key={item.id}
                drag="x"
                dragConstraints={{ left: -120, right: 0 }}
                dragElastic={0.08}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70) remove(item.id);
                }}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm"
              >
                <div className="size-20 shrink-0 overflow-hidden rounded-xl">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.size}
                  </p>
                  <p className="mt-1 font-black text-primary">
                    {product.retail} ج.م
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg"
                      onClick={() => decrement(item.id)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-5 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg"
                      onClick={() => increment(item.id)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* Coupon */}
        <section className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex gap-2">
            <Input
              value={coupon}
              onChange={(e) => {
                setCoupon(e.target.value);
                setCouponApplied(false);
                setCouponMessage("");
              }}
              placeholder="كود الخصم"
              className="h-10 rounded-xl"
            />
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => {
                const valid = coupon.trim().toUpperCase() === "GOMLA10";
                setCouponApplied(valid);
                setCouponMessage(
                  valid ? "تم تطبيق كود خصم تجريبي 10%" : "الكود غير صحيح",
                );
              }}
            >
              تطبيق
            </Button>
          </div>
          {couponMessage && (
            <p
              className={`mt-2 text-xs font-bold ${couponApplied ? "text-brand-green-light" : "text-red-error"}`}
            >
              {couponMessage}
            </p>
          )}
        </section>

        {/* Notes */}
        <section className="rounded-2xl border border-border/70 bg-card p-4">
          <button
            className="flex w-full items-center justify-between text-sm font-bold"
            onClick={() => setShowNotes((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <MessageSquareText className="size-4 text-primary" />
              ملاحظات الطلب
            </span>
                      <span className="text-text-muted">
              {showNotes ? "إخفاء" : "إضافة"}
            </span>
          </button>
          {showNotes && (
            <div className="mt-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 200))}
                placeholder="اكتب أي ملاحظات للتوصيل..."
                className="min-h-20 resize-none rounded-xl"
              />
                            <p className="mt-1 text-left text-[11px] text-text-muted">
                {notes.length}/200
              </p>
            </div>
          )}
        </section>

        {/* Summary */}
        <section className="rounded-2xl border border-border/70 bg-card p-4">
          <h2 className="mb-3 font-black">ملخص الطلب</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
                            <span className="text-text-secondary">المجموع الفرعي</span>
              <span dir="ltr">{formatPrice(total)} ج.م</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">التوصيل</span>
              <span dir="ltr">{delivery === 0 ? "مجاني" : `${formatPrice(delivery)} ج.م`}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-brand-green-light">
                <span>الخصم</span>
                <span dir="ltr">-{formatPrice(discount)} ج.م</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-black">
              <span>الإجمالي</span>
              <span className="text-brand-orange" dir="ltr">{formatPrice(grandTotal)} ج.م</span>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky CTA */}
            <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border-subtle bg-bg-nav/95 p-3 shadow-2xl backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-text-secondary">الإجمالي النهائي</p>
            <p className="text-lg font-black text-brand-orange" dir="ltr">{formatPrice(grandTotal)} ج.م</p>
          </div>
          <Button
            onClick={onCheckout}
            className="h-12 flex-1 rounded-md bg-brand-green text-base font-black text-white hover:bg-brand-green-hover"
          >
            <ShieldCheck className="size-4" />
            إتمام الشراء
          </Button>
        </div>
      </div>
    </main>
  );
}
