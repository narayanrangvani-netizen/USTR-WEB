"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchProducts, type Product } from "@/lib/products";

export default function CategoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchProducts(true).then(setProducts).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load categories."));
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => counts.set(product.category, (counts.get(product.category) ?? 0) + 1));
    return [...counts].sort(([first], [second]) => first.localeCompare(second));
  }, [products]);

  return (
    <div className="space-y-6">
      <div><div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Categories</div><h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Product collections</h1><p className="mt-2 text-sm text-[#63452f]">Categories are taken from the products you create.</p></div>
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {categories.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{categories.map(([name, count]) => <div key={name} className="rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-5"><div className="text-sm font-medium uppercase tracking-[0.2em] text-[#63452f]">Collection</div><div className="mt-3 text-2xl font-semibold text-[#29221d]">{name}</div><div className="mt-2 text-sm text-[#63452f]">{count} product{count === 1 ? "" : "s"}</div></div>)}</div> : !error && <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">Collections will appear here as you add products.</p>}
    </div>
  );
}
