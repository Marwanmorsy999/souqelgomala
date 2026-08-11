"use client";

import { ProductBrowser } from "@/components/home/ProductBrowser";
import type { Product } from "@/lib/types";

type Props = {
  search?: string;
  onOpen: (product: Product) => void;
};

export function ShopPage({ search, onOpen }: Props) {
  return <ProductBrowser initialFilters={search ? { search } : {}} title="المتجر" onOpen={onOpen} />;
}
