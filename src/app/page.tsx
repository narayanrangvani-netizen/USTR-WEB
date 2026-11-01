"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";
import { Hero } from "@/components/storefront/Hero";
import { Newsletter } from "@/components/storefront/Newsletter";
import { ProductCard } from "@/components/storefront/ProductCard";
import { fetchProducts, type Product } from "@/lib/products";

const categories = [
  { label: "Oversized Tees", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80" },
  { label: "Casual Shirts", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80" },
  { label: "Graphic Layers", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80" },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((error: unknown) => setCatalogError(error instanceof Error ? error.message : "Could not load products."))
      .finally(() => setLoadingProducts(false));
  }, []);

  const featured = products.filter((product) => product.featured && product.status === "Published").slice(0, 4);
  const trending = products.filter((product) => product.bestseller && product.status === "Published").slice(0, 4);
  const arrivals = products.filter((product) => product.newArrival && product.status === "Published").slice(0, 4);

  return (
    <div className="bg-[#fffdfc] text-[#29221d]">
      <Header />
      <Hero />

      <main>
        <section id="collections" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Collections</p>
              <h2 className="mt-3 text-3xl font-semibold uppercase tracking-tight sm:text-4xl">Style for every mood</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {categories.map((category) => (
              <div key={category.label} className="group relative overflow-hidden rounded-[28px]">
                <img src={category.image} alt={category.label} className="h-80 w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#29221d]/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f2e9dd]">Explore</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{category.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#f2e9dd] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Featured</p>
                <h2 className="mt-3 text-3xl font-semibold uppercase tracking-tight sm:text-4xl">Curated picks</h2>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {!loadingProducts && !catalogError && featured.length === 0 && (
                <p className="col-span-full rounded-2xl bg-white/70 p-5 text-[#63452f]">New featured pieces are on the way.</p>
              )}
              {catalogError && <p role="alert" className="col-span-full rounded-2xl bg-red-50 p-5 text-red-800">{catalogError}</p>}
            </div>
          </div>
        </section>

        <section id="new-arrivals" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">New arrivals</p>
              <h2 className="mt-3 text-3xl font-semibold uppercase tracking-tight sm:text-4xl">Freshly dropped</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {arrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {!loadingProducts && !catalogError && arrivals.length === 0 && (
              <p className="col-span-full rounded-2xl bg-[#f9f3ee] p-5 text-[#63452f]">No new arrivals are published yet.</p>
            )}
          </div>
        </section>

        <section className="bg-[#f9f3ee] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Trending</p>
                <h2 className="mt-3 text-3xl font-semibold uppercase tracking-tight sm:text-4xl">Bestsellers</h2>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {trending.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {!loadingProducts && !catalogError && trending.length === 0 && (
                <p className="col-span-full rounded-2xl bg-white/70 p-5 text-[#63452f]">No bestsellers are published yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[32px] bg-[#f2e9dd]">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="p-8 sm:p-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Campaign</p>
                <h2 className="mt-4 max-w-md text-4xl font-semibold uppercase tracking-tight text-[#29221d]">Styled for movement</h2>
                <p className="mt-5 max-w-md text-base text-[#63452f]">
                  Everyday pieces shaped for comfort, confidence, and expressive city living.
                </p>
                <button className="mt-8 rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">
                  Shop the drop
                </button>
              </div>
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80"
                alt="Campaign banner"
                className="h-full min-h-[320px] w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[30px] bg-[#f2e9dd] p-8 sm:p-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Brand story</p>
              <h2 className="mt-4 text-3xl font-semibold uppercase tracking-tight text-[#29221d] sm:text-5xl">Built for expression.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#63452f]">
                USTR SUITS is a modern fashion label creating pieces that fit the rhythm of everyday life—comfortable, intentional, and unmistakably yours.
              </p>
            </div>
            <div className="rounded-[30px] border border-stone-200 bg-white p-8">
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Why USTR</div>
              <ul className="mt-5 space-y-4 text-base text-[#63452f]">
                <li>• Premium cotton and tailored essentials</li>
                <li>• Oversized silhouettes with clean structure</li>
                <li>• Designed for daily movement</li>
                <li>• Premium feel without excess noise</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Newsletter />
      <Footer />
    </div>
  );
}
