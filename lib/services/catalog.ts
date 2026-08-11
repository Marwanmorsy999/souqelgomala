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

import type { Product, Category, Offer, SocialPost } from "../types";
import type { SiteSettings } from "../../src/lib/site-settings";

const API_BASE = "/api/catalog";

interface CatalogApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Catalog request failed: ${res.status}`);
  }
  const body = (await res.json()) as CatalogApiResponse<T>;
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

export type ProductSort =
  | "default"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "best_seller"
  | "featured";

/** Filter/sort params shared by the shop page and category listings. */
export interface ProductFilters {
  categoryId?: string;
  search?: string;
  discountedOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  unit?: string;
  inStockOnly?: boolean;
  sort?: ProductSort;
}

/** Facet values for the filter UI (from GET /api/catalog/facets). */
export interface CatalogFacets {
  units: string[];
  priceMin: number;
  priceMax: number;
  categories: Array<{ id: string; name: string; parentId: string | null }>;
}

/**
 * Fetch one page of products (optionally filtered by category / search /
 * discounted / price / unit / stock / sort). Returns the unwrapped page shape
 * the rest of this module expects ({ data, total, ... }) — pull `total` out of
 * the API's `meta` envelope.
 */
export async function fetchProducts(opts?: {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  search?: string;
  discounted?: boolean;
  minPrice?: number;
  maxPrice?: number;
  unit?: string;
  inStockOnly?: boolean;
  sort?: ProductSort;
}): Promise<CatalogListResult> {
  const q = new URLSearchParams();
  if (opts?.page) q.set("page", String(opts.page));
  if (opts?.pageSize) q.set("pageSize", String(opts.pageSize));
  if (opts?.categoryId) q.set("categoryId", opts.categoryId);
  if (opts?.search) q.set("search", opts.search);
  if (opts?.discounted) q.set("discounted", "true");
  if (opts?.minPrice != null && Number.isFinite(opts.minPrice)) q.set("minPrice", String(opts.minPrice));
  if (opts?.maxPrice != null && Number.isFinite(opts.maxPrice)) q.set("maxPrice", String(opts.maxPrice));
  if (opts?.unit) q.set("unit", opts.unit);
  if (opts?.inStockOnly) q.set("inStock", "true");
  if (opts?.sort && opts.sort !== "default") q.set("sort", opts.sort);
  const suffix = q.toString();
  const path = `/products${suffix ? `?${suffix}` : ""}`;
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Catalog request failed: ${res.status}`);
  }
  const body = (await res.json()) as CatalogApiResponse<Product[]>;
  if (!body.success || !body.data) {
    throw new Error("Catalog response missing data");
  }
  return {
    data: body.data,
    total: body.meta?.total ?? body.data.length,
    page: body.meta?.page ?? opts?.page ?? 1,
    pageSize: body.meta?.pageSize ?? opts?.pageSize ?? 100,
  };
}

/** Fetch the facet values used to build the storefront filter controls. */
export async function getFacets(): Promise<CatalogFacets> {
  return getJSON<CatalogFacets>("/facets");
}

/**
 * Fetch every matching product by walking all pages. Used for category views
 * and search where the full result set must be available client-side.
 */
async function fetchAllProducts(opts?: {
  categoryId?: string;
  search?: string;
  discounted?: boolean;
  pageSize?: number;
}): Promise<Product[]> {
  const pageSize = opts?.pageSize ?? 100;
  const all: Product[] = [];
  let page = 1;
  // Hard cap to avoid runaway loops on a misbehaving API.
  while (page <= 500) {
    const res = await fetchProducts({ page, pageSize, categoryId: opts?.categoryId, search: opts?.search, discounted: opts?.discounted });
    all.push(...res.data);
    if (all.length >= res.total || res.data.length === 0) break;
    page += 1;
  }
  return all;
}

/** Fetch all active products (walk all pages). */
export async function getProducts(): Promise<Product[]> {
  return fetchAllProducts({ pageSize: 100 });
}

/** Fetch a single product by id. */
export async function getProductById(id: string): Promise<Product | undefined> {
  const list = await fetchAllProducts({ pageSize: 100 });
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

/** Products in a given category (by Arabic category name). */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (!category || category === "الكل") {
    return getProducts();
  }
  const tree = await getJSON<Category[]>("/categories")
  const cats = flattenCategories(tree)
  const match = cats.find((c) => c.name === category);
  if (!match) return [];
  // Filter server-side by category id (handles the full 7k+ catalog).
  return fetchAllProducts({ categoryId: match.id, pageSize: 100 });
}

/** Search active products by query (server-side search across all pages). */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];
  return fetchAllProducts({ search: q, pageSize: 100 });
}

/**
 * Fetch all active categories (for the homepage circular categories).
 * Returns a flat list regardless of the server-side tree shape.
 */
export async function getCategories(): Promise<Category[]> {
  const tree = await getJSON<Category[]>("/categories")
  return flattenCategories(tree)
}

export function flattenCategories(tree: Category[]): Category[] {
  const flat: Category[] = []
  for (const c of tree) {
    flat.push(c)
    if (c.children && c.children.length > 0) {
      flat.push(...c.children)
    }
  }
  return flat
}

/**
 * Fetch categories as a tree (parents with nested children).
 * Used by the homepage sections and menu.
 */
export async function getCategoryTree(): Promise<Category[]> {
  return getJSON<Category[]>("/categories")
}

/** Campaign-level offers (from D1 offers table). Empty array when none active. */
export async function getOffers(): Promise<Offer[]> {
  return getJSON<Offer[]>("/offers");
}

/**
 * Combined "daily offers" payload for the homepage.
 * Returns campaign offers + discounted + featured products.
 * All data comes from real D1-backed API — no fake offers.
 */
export interface DailyOffersPayload {
  offers: Offer[];
  discounted: Product[];
  featured: Product[];
  updatedAt: string;
}

export async function getDailyOffers(): Promise<DailyOffersPayload> {
  return getJSON<DailyOffersPayload>("/offers");
}

/**
 * Admin-managed social posts for the storefront SocialFeed.
 * Real post URLs/thumbnails only — empty array when none are published.
 */
export async function getSocialPosts(): Promise<SocialPost[]> {
  return getJSON<SocialPost[]>("/social");
}

/** Merged site settings (D1 over lib/site.ts defaults) for the storefront. */
export async function getSiteInfo(): Promise<SiteSettings> {
  const res = await fetch("/api/site", { cache: "no-store" });
  const body = await res.json();
  if (body?.success && body.data) return body.data as SiteSettings;
  throw new Error("Site settings unavailable");
}
