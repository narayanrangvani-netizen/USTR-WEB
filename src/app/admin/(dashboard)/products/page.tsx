"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { fetchProducts, type Product } from "@/lib/products";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts(true)
      .then(setProducts)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load products."))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = !search || product.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || product.status === status;
    return matchesSearch && matchesStatus;
  }), [products, search, status]);
  const rackCount = products.filter((product) => product.status === "Published" && product.showOnRack && product.images.length > 0).length;

  async function handleStatus(product: Product) {
    const nextStatus: Product["status"] = product.status === "Archived" ? "Draft" : "Archived";
    setError("");
    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, status: nextStatus }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Could not update product status.");
      return;
    }
    setProducts((current) => current.map((item) => item.id === product.id ? { ...item, status: nextStatus } : item));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Products</div>
          <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Catalog manager</h1>
        </div>
        <Link href="/admin/add-product" className="rounded-full bg-[#29221d] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">Add product</Link>
      </div>
      <div className="grid gap-4 rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-4 md:grid-cols-[1fr_180px]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product name" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#63452f]" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#63452f]">
          <option value="All">All status</option><option value="Published">Published</option><option value="Draft">Draft</option><option value="Archived">Archived</option>
        </select>
      </div>
      {rackCount < 4 && <p className="rounded-2xl border border-[#ad8b68] bg-[#f2e9dd] p-4 text-sm text-[#63452f]">The showroom currently has {rackCount} of 4 recommended rack slots filled. Publish and enable rack visibility on more products to fill it.</p>}
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {loading ? <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">Loading catalog…</p> : filteredProducts.length === 0 ? (
        <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">{products.length ? "No products match this filter." : "Your catalog is empty. Add a product to get started."}</p>
      ) : (
        <div className="overflow-x-auto rounded-[28px] border border-stone-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f2e9dd] text-[#29221d]"><tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Collection</th><th className="p-4">Price</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
            <tbody>{filteredProducts.map((product) => (
              <tr key={product.id} className="border-t border-stone-200">
                <td className="p-4"><div className="flex items-center gap-3">
                  {product.images[0] ? <Image src={product.images[0]} alt="" width={48} height={48} unoptimized className="h-12 w-12 rounded-xl object-cover" /> : <div className="h-12 w-12 rounded-xl bg-[#e4d4c2]" />}
                  <div><div className="font-semibold text-[#29221d]">{product.name}</div><div className="text-xs uppercase tracking-[0.18em] text-[#63452f]">{product.sku}</div></div>
                </div></td>
                <td className="p-4 text-[#63452f]">{product.category}</td><td className="p-4 text-[#63452f]">{product.gender}</td>
                <td className="p-4 font-semibold text-[#29221d]">₹{product.price}</td>
                <td className="p-4"><span className="rounded-full bg-[#e4d4c2] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#29221d]">{product.status}</span></td>
                <td className="p-4"><div className="flex gap-2">
                  <Link href={`/admin/add-product?edit=${product.id}`} className="rounded-full border border-stone-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#29221d]">Edit</Link>
                  <button onClick={() => void handleStatus(product)} className="rounded-full border border-stone-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#29221d]">{product.status === "Archived" ? "Restore" : "Archive"}</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
