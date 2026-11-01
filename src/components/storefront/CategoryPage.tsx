"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";
import { ProductCard } from "@/components/storefront/ProductCard";
import { fetchProducts, type Product } from "@/lib/products";
import Link from "next/link";

export function CategoryPage({
  gender,
  title,
  productType,
}: {
  gender?: "Men" | "Women";
  title: string;
  productType?: "T-shirts" | "Shirts";
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load products."))
      .finally(() => setLoading(false));
  }, []);

  const categoryProducts = products.filter(
    (product) =>
      (!gender || product.gender === gender || product.gender === "Unisex") &&
      product.status === "Published" &&
      (!productType || product.category.toLowerCase().replace(/[^a-z]/g, "").includes(productType === "T-shirts" ? "tshirt" : "shirt")),
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
          <nav aria-label="Clothing categories" className="mt-5 flex flex-wrap gap-3">
            <Link href={gender ? gender === "Women" ? "/women" : "/men" : "/"} className="rounded-full border border-[#63452f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#63452f]">All</Link>
            <Link href="/t-shirts" aria-current={productType === "T-shirts" ? "page" : undefined} className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${productType === "T-shirts" ? "border-[#29221d] bg-[#29221d] text-white" : "border-[#63452f] text-[#63452f]"}`}>T-shirts</Link>
            <Link href="/shirts" aria-current={productType === "Shirts" ? "page" : undefined} className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${productType === "Shirts" ? "border-[#29221d] bg-[#29221d] text-white" : "border-[#63452f] text-[#63452f]"}`}>Shirts</Link>
          </nav>
        </div>
        {loading ? (
          <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">Loading collection…</p>
        ) : error ? (
          <p role="alert" className="rounded-[24px] bg-red-50 p-6 text-red-800">{error}</p>
        ) : categoryProducts.length ? (
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
