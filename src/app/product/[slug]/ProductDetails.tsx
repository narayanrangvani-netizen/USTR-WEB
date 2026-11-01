"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";
import { fetchProducts, calculateDiscount, getVariantStock, type Product } from "@/lib/products";

export default function ProductDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [purchaseError, setPurchaseError] = useState("");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load this product."))
      .finally(() => setLoading(false));
  }, []);

  const product = products.find((entry) => entry.slug === slug);
  const discount = product ? calculateDiscount(product) : 0;

  if (loading) {
    return <div className="min-h-screen bg-[#fffdfc] p-12 text-center text-[#63452f]">Loading product…</div>;
  }
  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#fffdfc] px-4 py-20 text-center text-[#63452f]">
        <h1 className="text-3xl font-semibold uppercase text-[#29221d]">{error ? "Catalog unavailable" : "Product not found"}</h1>
        <p role={error ? "alert" : undefined} className="mt-4">{error || "This product is no longer available."}</p>
        <Link href="/men" className="mt-6 inline-block rounded-full bg-[#29221d] px-6 py-3 text-white">Shop collection</Link>
      </div>
    );
  }
  const activeColor = product.colors.includes(selectedColor) ? selectedColor : product.colors[0] ?? "";
  const availableSizes = product.sizes.filter((size) => getVariantStock(product, activeColor, size) > 0);
  const activeSize = availableSizes.includes(selectedSize) ? selectedSize : availableSizes[0] ?? "";

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
            {product.images[0] ? <img src={product.images[0]} alt={product.name} className="h-[620px] w-full rounded-[30px] bg-[#f2e9dd] object-contain" /> : <div className="h-[620px] rounded-[30px] bg-[#f2e9dd]" />}
            <div className="grid grid-cols-3 gap-4">
              {product.images.map((image, index) => (
                <img key={`${product.id}-${index}`} src={image} alt={`${product.name} view ${index + 1}`} className="h-36 w-full rounded-[20px] bg-[#f2e9dd] object-contain" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">{product.category}</div>
              <h1 className="mt-2 text-4xl font-semibold uppercase tracking-tight text-[#29221d]">{product.name}</h1>
            </div>

            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-[#29221d]">₹{product.price.toLocaleString("en-IN")}</span>
              {product.mrp > product.price && <span className="text-lg text-stone-500 line-through">₹{product.mrp.toLocaleString("en-IN")}</span>}
              {discount > 0 && <span className="rounded-full bg-[#e4d4c2] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#29221d]">{discount}% OFF</span>}
            </div>

            <p className="text-base leading-7 text-[#63452f]">{product.description}</p>

            <div>
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#29221d]">Colour</div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const inStock = product.sizes.some((size) => getVariantStock(product, color, size) > 0);
                  return (
                  <button
                    key={color}
                    type="button"
                    disabled={!inStock}
                    aria-pressed={activeColor === color}
                    aria-label={`${color}${inStock ? "" : ", out of stock"}`}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${activeColor === color ? "border-[#29221d] bg-[#29221d] text-white" : "border-stone-300 bg-white text-[#63452f]"}`}
                  >
                    {color}
                  </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between text-sm font-semibold uppercase tracking-[0.2em] text-[#29221d]">
                <span>Size</span>
                <details className="focus-size-guide">
                  <summary>SIZE GUIDE</summary>
                  <p>{product.fit ? `Fit: ${product.fit}. ` : ""}Detailed garment measurements are not listed for this item. <Link href="/contact">Contact us</Link> for sizing help.</p>
                </details>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    disabled={getVariantStock(product, activeColor, size) < 1}
                    aria-pressed={activeSize === size}
                    aria-label={`Size ${size}${getVariantStock(product, activeColor, size) > 0 ? `, ${getVariantStock(product, activeColor, size)} available` : ", out of stock"}`}
                    onClick={() => setSelectedSize(size)}
                    className={`h-10 min-w-10 rounded-full border px-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${activeSize === size ? "border-[#29221d] bg-[#29221d] text-white" : "border-stone-300 bg-white text-[#63452f]"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {availableSizes.length === 0 && <p className="mt-2 text-sm text-[#8f251e]">This colour is currently out of stock.</p>}
              {activeSize && <p className="mt-2 text-sm text-[#63452f]">{getVariantStock(product, activeColor, activeSize)} available in size {activeSize}</p>}
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                disabled={!activeSize || !activeColor || getVariantStock(product, activeColor, activeSize) <= 0}
                onClick={() => {
                  if (!addToCart(product, { size: activeSize, color: activeColor })) {
                    setPurchaseError("This size is no longer available. Please choose another size.");
                  } else {
                    setPurchaseError("");
                  }
                }}
                className="rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#63452f]"
              >
                {getVariantStock(product, activeColor, activeSize) > 0 ? "Add to bag" : "Out of stock"}
              </button>
              <button
                type="button"
                disabled={!activeSize || !activeColor || getVariantStock(product, activeColor, activeSize) <= 0}
                onClick={() => {
                  if (!addToCart(product, { size: activeSize, color: activeColor }, 1, false)) {
                    setPurchaseError("This size is no longer available. Please choose another size.");
                    return;
                  }
                  setPurchaseError("");
                  router.push("/checkout");
                }}
                className="rounded-full border border-[#63452f] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#63452f] transition hover:border-[#29221d] hover:text-[#29221d] disabled:opacity-50"
              >Buy now</button>
            </div>
            {purchaseError && <p role="alert" className="text-sm text-red-800">{purchaseError}</p>}

            <div className="grid gap-4 rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-5 text-sm text-[#63452f]">
            <div className="flex justify-between"><span>Fabric</span><span>{product.fabric}</span></div>
            <div className="flex justify-between"><span>Fit</span><span>{product.fit}</span></div>
            <div className="flex justify-between"><span>Care</span><span>{product.care}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>Cost shown at checkout</span></div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/" className="rounded-full border border-[#63452f] px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-[#63452f]">Return to the showroom</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
