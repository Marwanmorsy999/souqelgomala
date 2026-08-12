"use client";

import { useEffect, useState } from "react";
import { ProductBrowser } from "@/components/home/ProductBrowser";
import { getCategories } from "@/lib/services/catalog";
import { resolveCategory } from "@/lib/categorization";
import type { Category, Product } from "@/lib/types";

type Props = {
  category: string;
  onBack: () => void;
  onOpen: (product: Product) => void;
};

export function CategoryProducts({ category, onBack, onOpen }: Props) {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const t = window.setTimeout(() => {
      if (active) setLoading(true);
    }, 0);
    getCategories()
      .then((cats: Category[]) => {
        if (!active) return;
        // Resolve by id first (homepage passes taxonomy ids), then by name for
        // legacy callers (nav menu / search overlay) that still pass a name.
        const match =
          cats.find((c) => c.id === category) ??
          cats.find((c) => c.name === category) ??
          (resolveCategory(category) ? cats.find((c) => c.id === resolveCategory(category)!.id) : undefined);
        setCategoryId(match?.id);
        if (match?.parent_id) {
          const parent = cats.find((c) => c.id === match.parent_id) ?? null
          setParentCategory(parent)
        } else {
          setParentCategory(null)
        }
      })
      .catch(() => active && setCategoryId(undefined))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
      window.clearTimeout(t);
    };
  }, [category]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background pb-28" dir="rtl">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </main>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-30 bg-background/95 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            aria-label="رجوع"
            className="flex size-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            {parentCategory && (
              <p className="text-xs text-muted-foreground">{parentCategory.name}</p>
            )}
            <h1 className="text-lg font-black">{category}</h1>
          </div>
        </div>
      </div>
      <ProductBrowser
        title={category}
        hideCategoryTree
        initialFilters={categoryId ? { categoryId } : {}}
        onOpen={onOpen}
      />
    </>
  );
}
