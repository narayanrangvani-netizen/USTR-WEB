import Link from "next/link";
import { calculateDiscount, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const discount = calculateDiscount(product);

  return (
    <Link href={`/product/${product.slug}`} className="group block overflow-hidden rounded-[28px] border border-stone-200 bg-[#f9f1e8] transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-80 overflow-hidden bg-[#f1e6d8]">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 flex gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
          {product.newArrival && <span className="rounded-full bg-white px-2 py-1 text-[#63452f]">New</span>}
          {discount > 0 && <span className="rounded-full bg-[#29221d] px-2 py-1 text-white">{discount}% OFF</span>}
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.18em] text-[#63452f]">
          <span>{product.category}</span>
          {product.bestseller && <span className="rounded-full bg-[#e4d4c2] px-2 py-1 text-[#29221d]">Bestseller</span>}
        </div>
        <h3 className="text-xl font-medium text-[#29221d]">{product.name}</h3>
        <div className="flex items-end gap-3">
          <span className="text-xl font-bold text-[#29221d]">₹{product.price}</span>
          <span className="text-sm text-stone-500 line-through">₹{product.mrp}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-[#63452f]">
          <span>{product.colors.length} colours</span>
          <span>{product.status === "Published" ? "In stock" : "Unpublished"}</span>
        </div>
      </div>
    </Link>
  );
}
