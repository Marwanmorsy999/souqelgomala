import { Banknote, CreditCard, Landmark } from "lucide-react";
import { paymentMethods } from "@/lib/site";

const iconMap = {
  cash: Banknote,
  card: CreditCard,
  wallet: Landmark,
} as const;

export function PaymentMethods() {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-black sm:text-2xl">خيارات الدفع</h2>
        <p className="text-sm text-muted-foreground">
          الطرق المتاحة حالياً عند إتمام الطلب
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {paymentMethods.length === 0 ? (
          <p className="rounded-2xl border border-border/70 bg-card px-5 py-3 text-sm text-muted-foreground shadow-sm">
            خيارات الدفع سيتم تفعيلها قريباً — للاستفسار تواصل معنا.
          </p>
        ) : (
          paymentMethods.map((m) => {
            const Icon = iconMap[m.id as keyof typeof iconMap] ?? Banknote;
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 rounded-2xl border px-5 py-3 shadow-sm ${
                  m.available
                    ? "border-border/70 bg-card"
                    : "border-border/50 bg-muted/40 opacity-60"
                }`}
              >
                <Icon
                  className={`size-6 ${m.available ? "text-primary" : "text-muted-foreground"}`}
                />
                <div>
                  <p className="text-sm font-bold">{m.label}</p>
                  {m.note && (
                    <p className="text-[11px] text-muted-foreground">
                      {m.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
