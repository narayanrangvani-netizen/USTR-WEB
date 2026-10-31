"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";
import { ProductCard } from "@/components/storefront/ProductCard";
import { DEFAULT_PRODUCTS, calculateDiscount, getCatalogProducts, type Product } from "@/lib/products";

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("Black");

  useEffect(() => {
    setProducts(getCatalogProducts());
  }, []);

  const product = products.find((entry) => entry.slug === params.slug) ?? DEFAULT_PRODUCTS[0];
  const related = products.filter((entry) => entry.gender === product.gender && entry.id !== product.id).slice(0, 3);
  const discount = calculateDiscount(product);

  return (
    <div className="bg-[#fffdfc] text-[#29221d]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3 text-sm text-[#63452f]">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={product.gender === "Men" ? "/men" : "/women"}>{product.gender}</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="grid gap-4">
            <img src={product.images[0]} alt={product.name} className="h-[620px] w-full rounded-[30px] object-cover" />
            <div className="grid grid-cols-3 gap-4">
              {product.images.map((image, index) => (
                <img key={`${product.id}-${index}`} src={image} alt={`${product.name} view ${index + 1}`} className="h-36 w-full rounded-[20px] object-cover" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">{product.category}</div>
              <h1 className="mt-2 text-4xl font-semibold uppercase tracking-tight text-[#29221d]">{product.name}</h1>
            </div>

            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-[#29221d]">₹{product.price}</span>
              <span className="text-lg text-stone-500 line-through">₹{product.mrp}</span>
              <span className="rounded-full bg-[#e4d4c2] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#29221d]">{discount}% OFF</span>
            </div>

            <p className="text-base leading-7 text-[#63452f]">{product.description}</p>

            <div>
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#29221d]">Colour</div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${selectedColor === color ? "border-[#29221d] bg-[#29221d] text-white" : "border-stone-300 bg-white text-[#63452f]"}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#29221d]">Size</div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-10 w-10 rounded-full border text-sm transition ${selectedSize === size ? "border-[#29221d] bg-[#29221d] text-white" : "border-stone-300 bg-white text-[#63452f]"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => addToCart(product, { size: selectedSize, color: selectedColor })}
                className="rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#63452f]"
              >
                Add to cart
              </button>
              <Link href="/checkout" className="rounded-full border border-[#63452f] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#63452f] transition hover:border-[#29221d] hover:text-[#29221d]">
                Buy now
              </Link>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-5 text-sm text-[#63452f]">
              <div className="flex justify-between"><span>Fabric</span><span>{product.fabric}</span></div>
              <div className="flex justify-between"><span>Fit</span><span>{product.fit}</span></div>
              <div className="flex justify-between"><span>Care</span><span>{product.care}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>3-5 days</span></div>
            </div>
          </div>
        </div>

        <section className="mt-20">
          <div className="mb-8 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Related products</div>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
