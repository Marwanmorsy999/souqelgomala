"use client";

import { env } from "@/lib/env";
import type { Product } from "@/lib/types";

type ProductLdJson = {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description?: string;
  image?: string | string[];
  sku?: string;
  brand?: { "@type": "Brand"; name: string };
  offers: {
    "@type": "Offer";
    price: number;
    priceCurrency: "EGP";
    availability: string;
    url: string;
  };
};

/**
 * Serialize JSON-LD safely for injection inside a <script> tag.
 * Escaping `<` prevents an injected `</script>` from breaking out of the tag.
 */
function toJsonLd(data: ProductLdJson): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Server-rendered Product JSON-LD structured data using real D1/Cloudinary data.
 * Rendered alongside the existing Organization schema on product detail views.
 *
 * Only emits fields that are actually available — it never invents product data.
 */
export default function ProductJsonLd({ product }: { product: Product }) {
  const json: ProductLdJson = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.image ? { image: product.image } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    offers: {
      "@type": "Offer",
      price: product.retail,
      priceCurrency: "EGP",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${env.NEXT_PUBLIC_APP_URL}/#/product/${product.id}`,
    },
  };

return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(json) }}
    />
  );
}
