"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { fetchProducts, type Product } from "@/lib/products";

type Category = { id: string; name: string; slug: string };

export default function CategoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryRecords, setCategoryRecords] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    Promise.all([
      fetchProducts(true),
      fetch("/api/admin/categories", { cache: "no-store" }).then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load categories.");
        return body.categories as Category[];
      }),
    ])
      .then(([loadedProducts, loadedCategories]) => {
        setProducts(loadedProducts);
        setCategoryRecords(loadedCategories);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load categories."));
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => counts.set(product.category, (counts.get(product.category) ?? 0) + 1));
    return categoryRecords.map((category) => ({ ...category, count: counts.get(category.name) ?? 0 }));
  }, [categoryRecords, products]);

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not save this category.");
      setCategoryRecords((current) => current.some((category) => category.id === body.category.id)
        ? current
        : [...current, body.category].sort((first, second) => first.name.localeCompare(second.name)));
      setName("");
      setMessage("Category saved. You can now assign it to products.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div><div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Categories</div><h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Product collections</h1><p className="mt-2 text-sm text-[#63452f]">Add a category here, then select it when creating or editing a product. Categories are retained to preserve product history.</p></div>
      <form onSubmit={addCategory} className="flex flex-col gap-3 rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-4 sm:flex-row">
        <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required placeholder="New category name" className="min-w-0 flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3" />
        <button type="submit" disabled={saving} className="rounded-full bg-[#29221d] px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60">{saving ? "Saving…" : "Add category"}</button>
      </form>
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="rounded-2xl bg-green-50 p-4 text-sm text-green-900">{message}</p>}
      {categories.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{categories.map((category) => <div key={category.id} className="rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-5"><div className="text-sm font-medium uppercase tracking-[0.2em] text-[#63452f]">Collection</div><div className="mt-3 text-2xl font-semibold text-[#29221d]">{category.name}</div><div className="mt-2 text-sm text-[#63452f]">{category.count} product{category.count === 1 ? "" : "s"}</div></div>)}</div> : !error && <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">No categories yet. Add one above or save a product category to create it.</p>}
    </div>
  );
}
