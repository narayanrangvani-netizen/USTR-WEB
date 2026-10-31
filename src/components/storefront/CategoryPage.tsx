"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";
import { ProductCard } from "@/components/storefront/ProductCard";
import { DEFAULT_PRODUCTS, getCatalogProducts, type Product } from "@/lib/products";

export function CategoryPage({ gender, title }: { gender: "Men" | "Women"; title: string }) {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);

  useEffect(() => {
    setProducts(getCatalogProducts());
  }, []);

  const categoryProducts = products.filter(
    (product) =>
      (product.gender === gender || product.gender === "Unisex") &&
      product.status === "Published",
  );

  return (
    <div className="bg-[#fffdfc] text-[#29221d]">
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">
            USTR SUITS
          </p>
          <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
            {title}
          </h1>
        </div>
        {categoryProducts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">
            No published products in this collection yet.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
