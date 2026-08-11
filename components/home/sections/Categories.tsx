"use client";

import { useEffect, useState } from "react";
import { getCategoryTree } from "@/lib/services/catalog";
import type { Category } from "@/lib/types";

type Props = { onSelect: (name: string) => void };

/**
 * Categories — hierarchical grid with parent categories and their subcategories.
 *
 * Parent categories render as larger cards with image + product count.
 * Subcategories render as smaller chips nested under their parent.
 */
export function Categories({ onSelect }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    getCategoryTree()
      .then((cats) => active && setCategories(cats))
      .catch(() => active && setCategories([]));
    return () => {
      active = false;
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <section id="categories" className="site-section scroll-mt-20">
      <div className="mb-4">
        <h2 className="text-xl font-black sm:text-2xl">الأقسام</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          تصفح الأقسام الرئيسية والفرعية
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((parent) => (
          <div key={parent.id} className="flex flex-col gap-2">
            <button
              onClick={() => onSelect(parent.name)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="relative size-14 overflow-hidden rounded-xl bg-muted">
                {parent.image && !parent.image.includes("placeholder") ? (
                  <img
                    src={parent.image}
                    alt={parent.name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-lg font-black text-primary/40">
                    {parent.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold leading-tight">{parent.name}</p>
                {parent.productCount != null && (
                  <p className="text-xs text-muted-foreground">
                    {parent.productCount} منتج
                  </p>
                )}
              </div>
            </button>

            {parent.children && parent.children.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {parent.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onSelect(child.name)}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
