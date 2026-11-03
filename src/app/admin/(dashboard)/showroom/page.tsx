"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchProducts, type Product } from "@/lib/products";

export default function ShowroomPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const rackProducts = products
    .filter((product) => product.status === "Published" && product.showOnRack && product.images.length > 0)
    .sort((first, second) => first.rackOrder - second.rackOrder);

  useEffect(() => {
    fetchProducts(true)
      .then(setProducts)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load showroom products."))
      .finally(() => setLoading(false));
  }, []);

  async function updateProduct(product: Product, update: { showOnRack?: boolean; rackOrder?: number }) {
    setSavingId(product.id);
    setError("");
    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, ...update }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not update the showroom.");
      setProducts((current) => current.map((item) => item.id === product.id
        ? { ...item, showOnRack: update.showOnRack ?? item.showOnRack, rackOrder: update.rackOrder ?? item.rackOrder }
        : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update the showroom.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Showroom</div>
        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Clothing rack</h1>
        <p className="mt-2 text-sm text-[#63452f]">Choose published products for the homepage rack and set their order. Changes are saved to the product catalogue.</p>
      </div>
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {loading ? <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">Loading showroom…</p> : products.length === 0 ? (
        <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">Add a product to begin curating the clothing rack.</p>
      ) : (
        <div className="overflow-x-auto rounded-[28px] border border-stone-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f2e9dd] text-[#29221d]"><tr><th className="p-4">Product</th><th className="p-4">Status</th><th className="p-4">On rack</th><th className="p-4">Order</th></tr></thead>
            <tbody>{products.map((product) => (
              <tr key={product.id} className="border-t border-stone-200">
                <td className="p-4"><div className="flex items-center gap-3">
                  {product.images[0] ? <Image src={product.images[0]} alt="" width={48} height={48} unoptimized className="h-12 w-12 rounded-xl object-cover" /> : <div className="h-12 w-12 rounded-xl bg-[#e4d4c2]" />}
                  <div><div className="font-semibold text-[#29221d]">{product.name}</div><div className="text-xs text-[#63452f]">{product.sku}</div></div>
                </div></td>
                <td className="p-4 text-[#63452f]">{product.status}</td>
                <td className="p-4"><input type="checkbox" aria-label={`Show ${product.name} on the clothing rack`} checked={product.showOnRack} disabled={product.status !== "Published" || savingId === product.id} onChange={(event) => void updateProduct(product, { showOnRack: event.target.checked })} /></td>
                <td className="p-4"><input type="number" min="0" max="10000" aria-label={`Rack order for ${product.name}`} defaultValue={product.rackOrder} disabled={savingId === product.id} onBlur={(event) => {
                  const rackOrder = Number(event.currentTarget.value);
                  if (Number.isInteger(rackOrder) && rackOrder >= 0 && rackOrder <= 10000 && rackOrder !== product.rackOrder) {
                    void updateProduct(product, { rackOrder });
                  }
                }} className="w-24 rounded-xl border border-stone-300 px-3 py-2" /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {!loading && rackProducts.length > 0 && <p className="text-sm text-[#63452f]">{rackProducts.length} product{rackProducts.length === 1 ? "" : "s"} currently eligible for the public rack.</p>}
    </div>
  );
}
