import { Tag } from "lucide-react";
import { brands } from "@/lib/site";

export function Brands() {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-black sm:text-2xl">العلامات المتوفرة</h2>
        <p className="text-sm text-muted-foreground">
          ماركات موجودة داخل تشكيلة سوق الجملة
        </p>
      </div>

      <div className="scrollbar-hide flex gap-3 overflow-x-auto px-1 pb-2">
        {brands.length === 0 ? (
          <p className="mx-auto text-sm text-muted-foreground">
            يتم تحديث العلامات التجارية قريباً.
          </p>
        ) : (
          brands.map((brand) => (
            <span
              key={brand}
              className="flex shrink-0 items-center gap-2 rounded-2xl border border-border/70 bg-card px-5 py-3 text-sm font-bold shadow-sm"
            >
              <Tag className="size-4 text-primary" />
              {brand}
            </span>
          ))
        )}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        وعلامات تجارية أخرى متوفرة حسب التشكيلة الحالية — تُحدَّث من إدارة
        المتجر.
      </p>
    </section>
  );
}
