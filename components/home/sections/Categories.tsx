"use client";

import { useEffect, useState } from "react";
import { getCategories } from "@/lib/services/catalog";
import type { Category } from "@/lib/types";

type Props = { onSelect: (name: string) => void };

export function Categories({ onSelect }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((cats) => active && setCategories(cats))
      .catch(() => active && setCategories([]));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="categories" className="mx-auto max-w-6xl scroll-mt-20 px-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black sm:text-2xl">تسوق على حسب أقسامنا</h2>
        <span className="flex items-center gap-1 text-xs text-muted-foreground md:hidden">
          اسحب للمزيد
        </span>
      </div>

      {/* Mobile: horizontal scroll · Desktop: grid */}
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 pt-1 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-5">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.name)}
            className="group flex w-24 shrink-0 snap-start flex-col items-center gap-2 text-center md:w-auto"
            aria-label={`قسم ${c.name}`}
          >
            <span className="relative size-24 overflow-hidden rounded-full bg-muted shadow-sm ring-1 ring-border/60 transition-transform duration-300 group-hover:-translate-y-1 group-hover:ring-primary/40 md:size-28 lg:size-32">
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            </span>
            <span className="text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {c.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
