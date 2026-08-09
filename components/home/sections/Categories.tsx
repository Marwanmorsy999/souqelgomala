"use client";

import { useEffect, useState } from "react";
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
    <section id="categories" className="site-section scroll-mt-20">
      <div className="mb-3">
        <h2 className="text-xl font-black sm:text-2xl">الأقسام</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          اقفز للقسم اللي بتشتري منه
        </p>
      </div>

      <div className="-mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4 md:mx-0 md:flex-wrap md:gap-2 md:overflow-visible md:px-0">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.name)}
            aria-label={`قسم ${c.name}`}
            className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-border bg-card py-2 pl-4 pr-4 text-sm font-bold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            {hasCategoryImage(c) && (
              <img
                src={c.image}
                alt=""
                loading="lazy"
                className="size-5 rounded-full object-cover"
              />
            )}
            <span className="max-w-32 truncate">{c.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
