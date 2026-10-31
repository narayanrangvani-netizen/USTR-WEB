"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchProducts, type Product } from "@/lib/products";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchProducts(true).then(setProducts).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load inventory."));
  }, []);

  const rows = useMemo(() => products.flatMap((product) =>
    product.colors.map((color) => ({ product, color, stock: product.stock[color] ?? 0 })),
  ), [products]);

  return (
    <div className="space-y-6">
      <div><div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Inventory</div><h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Colour stock summary</h1><p className="mt-2 text-sm text-[#63452f]">Stock shown is the total across all sizes for each colour.</p></div>
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {rows.length ? <div className="overflow-x-auto rounded-[28px] border border-stone-200"><table className="min-w-full text-left text-sm"><thead className="bg-[#f2e9dd] text-[#29221d]"><tr><th className="p-4">Product</th><th className="p-4">Colour</th><th className="p-4">Sizes</th><th className="p-4">Units</th><th className="p-4">Status</th></tr></thead><tbody>{rows.map(({ product, color, stock }) => <tr key={`${product.id}-${color}`} className="border-t border-stone-200"><td className="p-4 font-medium text-[#29221d]">{product.name}</td><td className="p-4 text-[#63452f]">{color}</td><td className="p-4 text-[#63452f]">{product.sizes.join(", ")}</td><td className="p-4 font-semibold text-[#29221d]">{stock}</td><td className="p-4"><span className="rounded-full bg-[#e4d4c2] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#29221d]">{stock === 0 ? "Out of stock" : stock < 5 ? "Low stock" : "In stock"}</span></td></tr>)}</tbody></table></div> : !error && <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">Inventory appears here after products are added.</p>}
    </div>
  );
}
