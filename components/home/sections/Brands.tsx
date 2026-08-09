import { brands } from "@/lib/site";

export function Brands() {
  if (brands.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-black sm:text-2xl">العلامات المتوفرة</h2>
        <p className="text-sm text-muted-foreground">
          ماركات موجودة داخل تشكيلة سوق الجملة
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="group flex items-center justify-center rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <img
              src={brand.logo_url}
              alt={brand.name}
              loading="lazy"
              className="h-12 w-full object-contain transition-all duration-300 grayscale group-hover:grayscale-0 group-hover:scale-110 sm:h-14"
            />
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        وعلامات تجارية أخرى متوفرة حسب التشكيلة الحالية — تُحدَّث من إدارة
        المتجر.
      </p>
    </section>
  );
}
