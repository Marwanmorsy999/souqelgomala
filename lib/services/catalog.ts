/**
 * Catalog repository (storefront-facing) — D1 + KV backed.
 *
 * The UI reads catalog data ONLY through this service. Components never import
 * `lib/data` directly and never touch D1. This module is the async adapter that
 * consumes the public catalog API (D1 → Drizzle → catalog service → KV cache →
 * this client → React storefront).
 *
 * The frontend components continue to receive clean `Product` / `Category`
 * domain objects (lib/types.ts) — the source of truth moved from the demo
 * dataset to D1 + Cloudinary.
 */

import type { Product, Category } from "../types";

const API_BASE = "/api/catalog";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Catalog request failed: ${res.status}`);
  }
  const body = (await res.json()) as { success: boolean; data?: T };
  if (!body.success || !body.data) {
    throw new Error("Catalog response missing data");
  }
  return body.data;
}

export interface CatalogListResult {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
}

/** Fetch paginated products (optionally filtered by category / discounted). */
export async function fetchProducts(opts?: {
  page?: number;
  pageSize?: number;
}): Promise<CatalogListResult> {
  const q = new URLSearchParams();
  if (opts?.page) q.set("page", String(opts.page));
  if (opts?.pageSize) q.set("pageSize", String(opts.pageSize));
  return getJSON<CatalogListResult>(`/products${q.size ? `?${q}` : ""}`);
}

/** Fetch all active products (latest pagination default). */
export async function getProducts(): Promise<Product[]> {
  const result = await fetchProducts({ page: 1, pageSize: 100 });
  return result.data;
}

/** Fetch a single product by id. */
export async function getProductById(id: string): Promise<Product | undefined> {
  const list = await getProducts();
  return list.find((p) => p.id === id);
}

/** Best-selling products (from D1 best-seller flag). */
export async function getBestSelling(): Promise<Product[]> {
  const home = await getJSON<{
    featured: Product[];
    bestSellers: Product[];
    latest: Product[];
  }>("/home");
  return home.bestSellers;
}

/** Latest products (from D1 new-arrival / newest). */
export async function getLatest(): Promise<Product[]> {
  const home = await getJSON<{
    featured: Product[];
    bestSellers: Product[];
    latest: Product[];
  }>("/home");
  return home.latest;
}

/** Products in a given category (by category name). */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (!category || category === "الكل") {
    return getProducts();
  }
  const cats = await getJSON<Category[]>("/categories");
  const match = cats.find((c) => c.name === category);
  if (!match) return [];
  const result = await fetchProducts({ page: 1, pageSize: 100 });
  return result.data.filter((p) => p.category === category);
}

/** Search active products by query. */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];
  const all = await getProducts();
  return all.filter((p) =>
    `${p.name} ${p.english} ${p.category} ${p.brand ?? ""}`
      .toLowerCase()
      .includes(q.toLowerCase())
  );
}

/** Fetch all active categories (for the homepage circular categories). */
export async function getCategories(): Promise<Category[]> {
  return getJSON<Category[]>("/categories");
}
