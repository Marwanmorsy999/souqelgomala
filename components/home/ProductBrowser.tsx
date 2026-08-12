"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/home/ProductCard";
import { fetchProducts, getFacets, type CatalogFacets, type ProductFilters, type ProductSort } from "@/lib/services/catalog";
import type { Product } from "@/lib/types";

export type { ProductFilters, ProductSort };

const SORT_LABELS: Record<ProductSort, string> = {
  default: "الافتراضي",
  price_asc: "الأقل سعراً",
  price_desc: "الأعلى سعراً",
  newest: "الأحدث",
  best_seller: "الأكثر طلباً",
  featured: "المميزة أولاً",
};

const PRESET_PRICES: Array<{ label: string; max?: number; min?: number }> = [
  { label: "أقل من 50", max: 50 },
  { label: "50 - 100", min: 50, max: 100 },
  { label: "100 - 200", min: 100, max: 200 },
  { label: "أكثر من 200", min: 200 },
];

function buildFilterString(filters: ProductFilters): string {
  return JSON.stringify([
    filters.categoryId ?? "",
    filters.search ?? "",
    filters.discountedOnly ? "1" : "",
    filters.minPrice ?? "",
    filters.maxPrice ?? "",
    filters.unit ?? "",
    filters.inStockOnly ? "1" : "",
    filters.sort ?? "default",
  ]);
}

type Props = {
  /** Optional initial filters (e.g. category page or search query). */
  initialFilters?: ProductFilters;
  /** Hide the category tree (used when rendering inside a category page). */
  hideCategoryTree?: boolean;
  title?: string;
  onOpen: (product: Product) => void;
};

export function ProductBrowser({ initialFilters = {}, hideCategoryTree = false, title = "المتجر", onOpen }: Props) {
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [facets, setFacets] = useState<CatalogFacets | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pageSize = 24;
  const filterKey = buildFilterString(filters);

  // Load facets once.
  useEffect(() => {
    let active = true;
    getFacets()
      .then((f) => active && setFacets(f))
      .catch(() => active && setFacets(null));
    return () => {
      active = false;
    };
  }, []);

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    const t = window.setTimeout(() => setPage(1), 0);
    return () => window.clearTimeout(t);
  }, [filterKey]);

  // Fetch the current page.
  useEffect(() => {
    let active = true;
    const t = window.setTimeout(() => {
      if (active) setLoading(true);
    }, 0);
    const effectivePage = page;
    fetchProducts({
      page: effectivePage,
      pageSize,
      categoryId: filters.categoryId,
      search: filters.search,
      discounted: filters.discountedOnly,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      unit: filters.unit,
      inStockOnly: filters.inStockOnly,
      sort: filters.sort,
    })
      .then((res) => {
        if (!active) return;
        setProducts(res.data);
        setTotal(res.total);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
        setTotal(0);
        setLoading(false);
      });
    return () => {
      active = false;
      window.clearTimeout(t);
    };
  }, [filterKey, page]);

  const categoryTree = useMemo(() => {
    if (!facets) return { parents: [], childrenByParent: new Map<string, { id: string; name: string }[]>() };
    const parents = facets.categories
      .filter((c) => !c.parentId)
      .map((c) => ({ id: c.id, name: c.name }));
    const childrenByParent = new Map<string, { id: string; name: string }[]>();
    for (const c of facets.categories) {
      if (c.parentId) {
        const list = childrenByParent.get(c.parentId) ?? [];
        list.push({ id: c.id, name: c.name });
        childrenByParent.set(c.parentId, list);
      }
    }
    return { parents, childrenByParent };
  }, [facets]);

  const update = (patch: Partial<ProductFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const resetFilters = () => setFilters({ categoryId: hideCategoryTree ? filters.categoryId : undefined });

  const activeFilterCount =
    (filters.categoryId ? 1 : 0) +
    (filters.minPrice != null || filters.maxPrice != null ? 1 : 0) +
    (filters.unit ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.discountedOnly ? 1 : 0) +
    (filters.sort && filters.sort !== "default" ? 1 : 0);

  const FilterPanel = (
    <div className="flex flex-col gap-5">
      {!hideCategoryTree && (
        <div>
          <h3 className="mb-2 text-sm font-black">الأقسام</h3>
          <div className="flex flex-col gap-1">
            {categoryTree.parents.map((p) => {
              const children = categoryTree.childrenByParent.get(p.id) ?? [];
              return (
                <div key={p.id}>
                  <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={filters.categoryId === p.id}
                      onChange={() =>
                        update({ categoryId: filters.categoryId === p.id ? undefined : p.id })
                      }
                    />
                    <span className="font-bold">{p.name}</span>
                  </label>
                  {children.length > 0 && (
                    <div className="mr-4 flex flex-col gap-1 border-r border-border pr-3">
                      {children.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            checked={filters.categoryId === c.id}
                            onChange={() =>
                              update({ categoryId: filters.categoryId === c.id ? undefined : c.id })
                            }
                          />
                          <span>{c.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-black">السعر</h3>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {PRESET_PRICES.map((p) => {
            const active =
              filters.minPrice === p.min && filters.maxPrice === p.max;
            return (
              <button
                key={p.label}
                onClick={() =>
                  update({ minPrice: p.min, maxPrice: p.max })
                }
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="من"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              update({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="h-9 w-full rounded-lg border border-input bg-muted/60 px-2 text-sm outline-none focus:border-primary"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="إلى"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="h-9 w-full rounded-lg border border-input bg-muted/60 px-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {facets && facets.units.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-black">النوع / الوحدة</h3>
          <div className="flex flex-wrap gap-1.5">
            {facets.units.map((u) => (
              <button
                key={u}
                onClick={() => update({ unit: filters.unit === u ? undefined : u })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filters.unit === u ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.inStockOnly ?? false}
            onChange={(e) => update({ inStockOnly: e.target.checked || undefined })}
          />
          متوفر فقط
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.discountedOnly ?? false}
            onChange={(e) => update({ discountedOnly: e.target.checked || undefined })}
          />
          عروض فقط
        </label>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-black">الترتيب</h3>
        <select
          value={filters.sort ?? "default"}
          onChange={(e) => update({ sort: (e.target.value as ProductSort) || undefined })}
          className="h-9 w-full rounded-lg border border-input bg-muted/60 px-2 text-sm outline-none focus:border-primary"
        >
          {(Object.keys(SORT_LABELS) as ProductSort[]).map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={resetFilters}
          className="rounded-lg border border-border py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
        >
          مسح الفلاتر ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/95 px-4 py-3">
        <h1 className="flex-1 text-lg font-black">{title}</h1>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-bold transition-colors hover:bg-muted lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          فلاتر
                    {activeFilterCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-green text-[10px] font-black text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </header>

      <div className="mx-auto flex max-w-6xl gap-5 px-3 max-[640px]:px-2 py-4">
        {/* Desktop sidebar */}
                <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-16 rounded-lg border border-border-default bg-bg-surface p-4">{FilterPanel}</div>
        </aside>

        <div className="min-w-0 flex-1">
          <p className="mb-3 text-xs text-text-secondary">
            {loading ? "جار التحميل..." : `${total} منتج`}
          </p>

          {loading ? (
                        <div className="grid grid-cols-2 gap-3 max-[640px]:gap-x-1.5 max-[640px]:gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-lg bg-bg-surface" />
              ))}
            </div>
          ) : products.length === 0 ? (
                        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-center">
              <p className="text-lg font-black">لا توجد منتجات مطابقة</p>
              <p className="text-sm text-text-secondary">جرّب تغيير الفلاتر أو مسحها.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 max-[640px]:gap-x-1.5 max-[640px]:gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onOpen={onOpen} />
                ))}
              </div>
              {total > products.length && (
                <div className="mt-5 flex justify-center">
                                    <button
                    onClick={() => setPage((pg) => pg + 1)}
                    className="rounded-lg bg-brand-green px-6 py-2.5 text-sm font-black text-white transition-colors hover:bg-brand-green-hover"
                  >
                    تحميل المزيد
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-4">
              <span className="text-lg font-black">الفلاتر</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="إغلاق"
                className="flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">{FilterPanel}</div>
            <div className="border-t p-3">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
              >
                عرض النتائج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
