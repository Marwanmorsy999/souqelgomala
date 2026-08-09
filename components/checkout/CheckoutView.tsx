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
import { getProducts } from "@/lib/services/catalog";
import { delivery as deliveryConfig, SITE, waLink } from "@/lib/site";
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
    street: "",
    building: "",
    floor: "",
    notes: "",
  });
const [timeSlot, setTimeSlot] = useState(timeSlots[0]);
  const [payment, setPayment] = useState("cash");
  const [done, setDone] = useState(false);
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

  const delivery = total >= deliveryConfig.freeAbove ? 0 : deliveryConfig.fee;
  const grandTotal = total + delivery;
  const filled = address.street.trim().length > 3;

  // Build a readable order summary and send it to the store's WhatsApp.
  const handleOrder = () => {
    const lines = [
      "طلب جديد من سوق الجملة 🛒",
      "",
...cart.map((item) => {
        const p = productMap[item.id];
        return p
          ? `• ${p.name} (${p.size}) × ${item.quantity} = ${p.retail * item.quantity} ج.م`
          : `• صنف ${item.id} × ${item.quantity}`;
      }),
      "",
      `المجموع: ${total} ج.م`,
      delivery > 0 ? `التوصيل: ${delivery} ج.م` : "التوصيل: مجاني",
      `الإجمالي: ${grandTotal} ج.م`,
      "",
      `العنوان: ${address.street}${address.building ? ` — عمارة ${address.building}` : ""}${address.floor ? ` — دور ${address.floor}` : ""}`,
      `وقت التوصيل: ${timeSlot}`,
      address.notes ? `ملاحظات: ${address.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `${waLink}?text=${encodeURIComponent(lines)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setDone(true);
    setTimeout(onSuccess, 3000);
  };

  if (done) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center"
        dir="rtl"
      >
        <div className="flex size-24 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-14 text-primary" />
        </div>
        <h1 className="text-3xl font-black">طلبك اتحضّر! 🎉</h1>
        <p className="max-w-sm text-muted-foreground">
          فتحنا واتساب وأرسلنا تفاصيل طلبك إلى {SITE.name}. هنأكد الطلب معاك على
          الرقم أو الواتساب بعدها.
        </p>
        <p className="text-sm text-muted-foreground">
          رح يوصل: <strong>{timeSlot}</strong>
        </p>
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
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="size-12 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{product.name}</p>
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
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المنتجات</span>
                    <span>{total} ج.م</span>
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
