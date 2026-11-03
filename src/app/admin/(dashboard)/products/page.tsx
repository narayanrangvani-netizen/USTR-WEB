"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { fetchProducts, type Product } from "@/lib/products";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [gender, setGender] = useState("All");
  const [category, setCategory] = useState("All");
  const [inventory, setInventory] = useState("All");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts(true)
      .then(setProducts)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load products."))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query);
    const matchesStatus = status === "All" || product.status === status;
    const matchesGender = gender === "All" || product.gender === gender;
    const matchesCategory = category === "All" || product.category === category;
    const stockValues = Object.values(product.variantStock);
    const totalStock = stockValues.reduce((sum, quantity) => sum + quantity, 0);
    const matchesInventory = inventory === "All" ||
      (inventory === "In stock" && totalStock > 0) ||
      (inventory === "Low stock" && stockValues.some((quantity) => quantity > 0 && quantity < 5)) ||
      (inventory === "Out of stock" && totalStock === 0);
    return matchesSearch && matchesStatus && matchesGender && matchesCategory && matchesInventory;
  }), [products, search, status, gender, category, inventory]);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice(page * pageSize, (page + 1) * pageSize);
  const categoryOptions = [...new Set(products.map((product) => product.category))].sort((first, second) => first.localeCompare(second));
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
      <div className="grid gap-3 rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-4 sm:grid-cols-2 xl:grid-cols-5">
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search name or SKU" className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#63452f]" />
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#63452f]">
          <option value="All">All status</option><option value="Published">Published</option><option value="Draft">Draft</option><option value="Archived">Archived</option>
        </select>
        <select value={gender} onChange={(event) => { setGender(event.target.value); setPage(0); }} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#63452f]"><option value="All">All collections</option><option value="Men">Men</option><option value="Women">Women</option><option value="Unisex">Unisex</option></select>
        <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(0); }} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#63452f]"><option value="All">All categories</option>{categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
        <select value={inventory} onChange={(event) => { setInventory(event.target.value); setPage(0); }} className="rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-[#63452f]"><option value="All">All inventory</option><option value="In stock">In stock</option><option value="Low stock">Low stock</option><option value="Out of stock">Out of stock</option></select>
      </div>
      {rackCount < 4 && <p className="rounded-2xl border border-[#ad8b68] bg-[#f2e9dd] p-4 text-sm text-[#63452f]">The showroom currently has {rackCount} of 4 recommended rack slots filled. Publish and enable rack visibility on more products to fill it.</p>}
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {loading ? <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">Loading catalog…</p> : filteredProducts.length === 0 ? (
        <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">{products.length ? "No products match this filter." : "Your catalog is empty. Add a product to get started."}</p>
      ) : (
        <div className="overflow-x-auto rounded-[28px] border border-stone-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f2e9dd] text-[#29221d]"><tr><th className="p-4">Product / SKU</th><th className="p-4">Category</th><th className="p-4">Collection</th><th className="p-4">Price / MRP</th><th className="p-4">Inventory</th><th className="p-4">Status</th><th className="p-4">Rack</th><th className="p-4">Added</th><th className="p-4">Action</th></tr></thead>
            <tbody>{visibleProducts.map((product) => (
              <tr key={product.id} className="border-t border-stone-200">
                <td className="p-4"><div className="flex items-center gap-3">
                  {product.images[0] ? <Image src={product.images[0]} alt="" width={48} height={48} unoptimized className="h-12 w-12 rounded-xl object-cover" /> : <div className="h-12 w-12 rounded-xl bg-[#e4d4c2]" />}
                  <div><div className="font-semibold text-[#29221d]">{product.name}</div><div className="text-xs uppercase tracking-[0.18em] text-[#63452f]">{product.sku}</div></div>
                </div></td>
                <td className="p-4 text-[#63452f]">{product.category}</td><td className="p-4 text-[#63452f]">{product.gender}</td>
                <td className="p-4 font-semibold text-[#29221d]">₹{product.price.toLocaleString("en-IN")}<div className="text-xs font-normal text-[#63452f]">MRP ₹{product.mrp.toLocaleString("en-IN")}</div></td>
                <td className="p-4 text-[#63452f]">{Object.values(product.variantStock).reduce((sum, quantity) => sum + quantity, 0)} units</td>
                <td className="p-4"><span className="rounded-full bg-[#e4d4c2] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#29221d]">{product.status}</span></td>
                <td className="p-4 text-[#63452f]">{product.showOnRack ? `Yes · ${product.rackOrder}` : "No"}</td>
                <td className="p-4 text-[#63452f]">{new Date(product.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="p-4"><div className="flex gap-2">
                  <Link href={`/admin/add-product?edit=${product.id}`} className="rounded-full border border-stone-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#29221d]">Edit</Link>
                  <button onClick={() => void handleStatus(product)} className="rounded-full border border-stone-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#29221d]">{product.status === "Archived" ? "Restore" : "Archive"}</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {!loading && filteredProducts.length > 0 && <div className="flex items-center justify-between gap-4 text-sm text-[#63452f]"><span>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredProducts.length)} of {filteredProducts.length} products</span><div className="flex gap-2"><button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded-full border border-stone-300 px-4 py-2 disabled:opacity-50">Previous</button><button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="rounded-full border border-stone-300 px-4 py-2 disabled:opacity-50">Next</button></div></div>}
    </div>
  );
}
