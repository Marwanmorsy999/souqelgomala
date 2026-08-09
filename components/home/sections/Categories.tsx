"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getCategories } from "@/lib/services/catalog";
import { hasCategoryImage } from "@/lib/utils";
import type { Category } from "@/lib/types";

type Props = { onSelect: (name: string) => void };

/**
 * Categories — compact quick-navigation chips.
 *
 * Stays vertically small (a merchant just needs to jump to the section they
 * buy from). Categories without a real icon render a branded letter chip — no
 * empty placeholder circles.
 */
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

  if (categories.length === 0) return null;

  return (
    <section id="categories" className="mx-auto max-w-6xl scroll-mt-20 px-4">
      <div className="mb-3">
        <h2 className="text-xl font-black sm:text-2xl">الأقسام</h2>
        <p className="text-sm text-muted-foreground">
          اقفز للقسم اللي بتشتري منه
        </p>
      </div>

      <div className="scrollbar-hide -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:gap-2.5 md:overflow-visible md:px-0">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.name)}
            aria-label={`قسم ${c.name}`}
            className="group flex shrink-0 snap-start items-center gap-2 rounded-full border border-border/70 bg-card py-1.5 pl-3 pr-1.5 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted">
              {hasCategoryImage(c) ? (
                <img
                  src={c.image}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-[13px] font-black text-primary">
                  {c.name.trim().charAt(0)}
                </span>
              )}
            </span>
            <span className="max-w-28 truncate">{c.name}</span>
            <ChevronLeft className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
          </button>
        ))}
      </div>
    </section>
  );
}
