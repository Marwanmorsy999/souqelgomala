"use client";

import { useEffect, useState } from "react";
import { ProductBrowser } from "@/components/home/ProductBrowser";
import { getCategories } from "@/lib/services/catalog";
import type { Category, Product } from "@/lib/types";

type Props = {
  category: string;
  onBack: () => void;
  onOpen: (product: Product) => void;
};

export function CategoryProducts({ category, onBack, onOpen }: Props) {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const t = window.setTimeout(() => {
      if (active) setLoading(true);
    }, 0);
    getCategories()
      .then((cats: Category[]) => {
        if (!active) return;
        const match = cats.find((c) => c.name === category);
        setCategoryId(match?.id);
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
      <button
        onClick={onBack}
        aria-label="رجوع"
        className="fixed right-3 top-3 z-30 flex size-9 items-center justify-center rounded-lg bg-background/95 shadow border transition-colors hover:bg-muted"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <ProductBrowser
        title={`قسم ${category}`}
        hideCategoryTree
        initialFilters={categoryId ? { categoryId } : {}}
        onOpen={onOpen}
      />
    </>
  );
}
