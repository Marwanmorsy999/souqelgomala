import { NextRequest } from "next/server";
import { getFacets } from "@/services/catalog/service";
import { ok, fail, serverError } from "@/services/api-response";

export const dynamic = "force-dynamic";

/**
 * Public catalog facets endpoint.
 *
 * GET /api/catalog/facets
 *
 * Returns distinct facet values for the storefront filter UI: normalized unit
 * values present on active products, active price bounds, and the active
 * category tree (id + parent). Reads go through the catalog service
 * (D1 source of truth + KV cache).
 */
export async function GET(_request: NextRequest) {
  try {
    const facets = await getFacets();
    return ok(facets);
  } catch (err) {
    console.error("Catalog facets error", err);
    return serverError("فشل تحميل الفلاتر");
  }
}
