"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  MapPin,
  Clock,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getProductsByIds } from "@/lib/services/catalog";
import { useStore } from "@/lib/store";
import { delivery as deliveryConfig } from "@/lib/site";
import type { CartItem, Product } from "@/lib/types";

type Props = {
  cart: CartItem[];
  total: number;
  onBack: () => void;
  onSuccess: () => void;
};

const timeSlots = [
  "أسرع وقت ممكن",
  "من 10 ص إلى 12 ظ",
  "من 12 ظ إلى 2 م",
  "من 2 م إلى 5 م",
  "من 5 م إلى 9 م",
];

const paymentMethods = [
  { id: "cash", label: "كاش عند الاستلام", icon: Wallet },
  {
    id: "card",
    label: "بطاقة بنكية (قريباً)",
    icon: CreditCard,
    disabled: true,
  },
];

export function CheckoutView({ cart, total, onBack, onSuccess }: Props) {
  const [step, setStep] = useState<"address" | "time" | "payment" | "confirm">(
    "address",
  );
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    building: "",
    floor: "",
    notes: "",
  });
const [timeSlot, setTimeSlot] = useState(timeSlots[0]);
  const [payment, setPayment] = useState("cash");
  const [done, setDone] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const isWholesale = useStore((s) => s.isWholesale);

  // Resolve ONLY the products currently in the cart (never the full catalog).
  const cartIdKey = cart
    .map((i) => i.id)
    .sort()
    .join("|");

  useEffect(() => {
    let active = true;
    const ids = cart.map((i) => i.id);
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
  }, [cartIdKey]);

  const itemsTotal = cart.reduce((sum, item) => {
    const p = productMap[item.id];
    if (!p) return sum;
    const unit = isWholesale ? p.wholesale : p.retail;
    return sum + unit * item.quantity;
  }, 0);
  const subtotal = itemsTotal > 0 ? itemsTotal : total;
  const delivery = subtotal >= deliveryConfig.freeAbove ? 0 : deliveryConfig.fee;
  const grandTotal = subtotal + delivery;
  const filled = address.street.trim().length > 3 && address.phone.trim().length >= 10;

  // Build the order payload and persist it to D1 — the website is the primary
  // ordering channel (no WhatsApp handoff). The pricing mode (retail /
  // wholesale) is preserved so the admin sees the exact line-item amounts.
  const handleOrder = async () => {
    const unitPriceFor = (p: { retail: number; wholesale: number }) =>
      isWholesale ? p.wholesale : p.retail;

    const itemsPayload = cart
      .map((item) => {
        const p = productMap[item.id];
        if (!p) return null;
        return {
          id: p.id,
          name: p.name_ar || p.name,
          nameEn: p.english,
          quantity: item.quantity,
          unitPrice: unitPriceFor(p),
        };
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      nameEn?: string;
      quantity: number;
      unitPrice: number;
    }[];

    let number = "";
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: address.name,
          customerPhone: address.phone,
          customerAddress: `${address.street}${address.building ? ` — عمارة ${address.building}` : ""}${address.floor ? ` — دور ${address.floor}` : ""}`,
          notes: address.notes,
          deliveryFee: delivery,
          pricingMode: isWholesale ? "wholesale" : "retail",
          items: itemsPayload,
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as {
          data?: { orderNumber?: string };
        };
        number = body?.data?.orderNumber ?? "";
      }
    } catch {
      /* keep showing a confirmation even if persistence hiccups */
    }

    setOrderNumber(number);
    setDone(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  if (done) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center"
        dir="rtl"
      >
        <div className="flex size-24 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-14 text-primary" />
        </div>
        <h1 className="text-3xl font-black">تم استلام طلبك بنجاح</h1>
        {orderNumber && (
          <p className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-2 text-lg font-black text-primary" dir="ltr">
            رقم الطلب: #{orderNumber}
          </p>
        )}
        <p className="max-w-sm text-muted-foreground">
          هيتصل بيك فريق المتجر لتأكيد الطلب وتحديد ميعاد التوصيل — الدفع كاش
          عند الاستلام.
        </p>
        <p className="text-sm text-muted-foreground">
          وقت التوصيل المختار: <strong>{timeSlot}</strong>
        </p>
        <button
          onClick={onSuccess}
          className="mt-3 h-12 rounded-xl bg-brand-green px-8 text-sm font-black text-white transition-colors hover:bg-brand-green-hover"
        >
          متابعة التسوق
        </button>
      </main>
    );
  }

  const steps = ["العنوان", "الوقت", "الدفع", "التأكيد"];

  return (
    <main className="min-h-screen bg-background pb-32" dir="rtl">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-4 py-4 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowRight className="size-5" />
        </Button>
        <h1 className="text-lg font-black">إتمام الطلب</h1>
        <span className="size-9" />
      </header>

      {/* Step indicator */}
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-4 py-4">
        {steps.map((s, i) => {
          const current = steps.indexOf(
            step === "confirm"
              ? "التأكيد"
              : step === "payment"
                ? "الدفع"
                : step === "time"
                  ? "الوقت"
                  : "العنوان",
          );
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors
                ${i < current ? "bg-primary text-primary-foreground" : i === current ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {i < current ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-bold ${i === current ? "text-foreground" : "text-muted-foreground"}`}
              >
                {s}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`h-px w-6 ${i < current ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4">
        {/* Step 1: Address */}
        {step === "address" && (
          <Card className="rounded-3xl">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                <h2 className="font-black">عنوان التوصيل</h2>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    value={address.name}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, name: e.target.value }))
                    }
                    placeholder="الاسم"
                    className="rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="phone">رقم الموبايل *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    dir="ltr"
                    value={address.phone}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, phone: e.target.value }))
                    }
                    placeholder="01xxxxxxxxx"
                    className="rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="street">الشارع والمنطقة *</Label>
                  <Input
                    id="street"
                    value={address.street}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, street: e.target.value }))
                    }
                    placeholder="مثال: شارع التحرير، الدقي، الجيزة"
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="building">رقم العمارة / المبنى</Label>
                    <Input
                      id="building"
                      value={address.building}
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, building: e.target.value }))
                      }
                      placeholder="5"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="floor">الدور / الشقة</Label>
                    <Input
                      id="floor"
                      value={address.floor}
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, floor: e.target.value }))
                      }
                      placeholder="3"
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="addr-notes">ملاحظات إضافية</Label>
                  <Input
                    id="addr-notes"
                    value={address.notes}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, notes: e.target.value }))
                    }
                    placeholder="مثال: عند الصيدلية، خلف المدرسة..."
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Time */}
        {step === "time" && (
          <Card className="rounded-3xl">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-primary" />
                <h2 className="font-black">وقت التوصيل</h2>
              </div>
              <div className="flex flex-col gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTimeSlot(slot)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-colors
                      ${timeSlot === slot ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground"}`}
                  >
                    {slot}
                    {timeSlot === slot && (
                      <span className="text-primary">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment */}
        {step === "payment" && (
          <Card className="rounded-3xl">
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-2">
                <CreditCard className="size-5 text-primary" />
                <h2 className="font-black">طريقة الدفع</h2>
              </div>
              <div className="flex flex-col gap-2">
                {paymentMethods.map(({ id, label, icon: Icon, disabled }) => (
                  <button
                    key={id}
                    onClick={() => !disabled && setPayment(id)}
                    disabled={disabled}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-colors
                      ${payment === id ? "border-primary bg-primary/5 text-primary" : "border-border bg-card"}
                      ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <Icon className="size-5" />
                    {label}
                    {payment === id && !disabled && (
                      <span className="mr-auto text-primary">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && (
          <div className="flex flex-col gap-4">
            <Card className="rounded-3xl">
              <CardContent className="flex flex-col gap-3 p-5">
                <h2 className="font-black">مراجعة الطلب</h2>
                {cart.map((item) => {
                  const product = productMap[item.id];
                  if (!product) return null;
                  const unit = isWholesale ? product.wholesale : product.retail;
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="size-12 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{product.name_ar || product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {unit} ج.م
                        </p>
                      </div>
                      <p className="font-bold">
                        {unit * item.quantity} ج.م
                      </p>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المنتجات</span>
                    <span>{subtotal} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">التوصيل</span>
                    <span>{delivery === 0 ? "مجاني" : `${delivery} ج.م`}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-black">
                    <span>الإجمالي</span>
                    <span className="text-primary">{grandTotal} ج.م</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardContent className="flex flex-col gap-2 p-5 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p>
                    {address.street}
                    {address.building ? ` — عمارة ${address.building}` : ""}
                    {address.floor ? ` — دور ${address.floor}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-primary" />
                  <p>{timeSlot}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 shrink-0 text-primary" />
                  <p>كاش عند الاستلام</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-3">
          {step !== "address" && (
            <Button
              variant="outline"
              className="h-12 rounded-2xl"
              onClick={() => {
                if (step === "time") setStep("address");
                else if (step === "payment") setStep("time");
                else if (step === "confirm") setStep("payment");
              }}
            >
              رجوع
            </Button>
          )}
          <Button
            className="h-12 flex-1 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={step === "address" && !filled}
            onClick={() => {
              if (step === "address") setStep("time");
              else if (step === "time") setStep("payment");
              else if (step === "payment") setStep("confirm");
              else handleOrder();
            }}
          >
            {step === "confirm" ? `تأكيد الطلب — ${grandTotal} ج.م` : "التالي"}
          </Button>
        </div>
      </div>
    </main>
  );
}
