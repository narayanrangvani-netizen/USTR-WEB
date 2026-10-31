"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DEFAULT_PRODUCTS, getCatalogProducts, saveCatalogProducts, type Product } from "@/lib/products";

const baseForm = {
  name: "",
  category: "Oversized T-shirts",
  gender: "Men",
  type: "Graphic T-shirts",
  description: "",
  price: "999",
  mrp: "1499",
  colors: "Black, Sand",
  sizes: "S, M, L, XL",
  sku: "UST-NEW",
  fabric: "Premium cotton",
  fit: "Relaxed fit",
  care: "Wash cold, line dry",
  status: "Published",
  featured: false,
  newArrival: true,
  bestseller: false,
};

export default function AddProductPage() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const [form, setForm] = useState(baseForm);

  useEffect(() => {
    const products = getCatalogProducts();
    const target = products.find((product) => product.id === editId);
    if (!target) return;
    setForm({
      name: target.name,
      category: target.category,
      gender: target.gender,
      type: target.type,
      description: target.description,
      price: String(target.price),
      mrp: String(target.mrp),
      colors: target.colors.join(", "),
      sizes: target.sizes.join(", "),
      sku: target.sku,
      fabric: target.fabric,
      fit: target.fit,
      care: target.care,
      status: target.status,
      featured: target.featured,
      newArrival: target.newArrival,
      bestseller: target.bestseller,
    });
  }, [editId]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const products = getCatalogProducts();

    const nextProduct: Product = {
      id: editId ?? `prod-${Date.now()}`,
      slug: (form.name || "new-product").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      name: form.name,
      gender: form.gender as Product["gender"],
      category: form.category,
      type: form.type,
      description: form.description,
      price: Number(form.price),
      mrp: Number(form.mrp),
      colors: form.colors.split(",").map((value) => value.trim()).filter(Boolean),
      sizes: form.sizes.split(",").map((value) => value.trim()).filter(Boolean),
      stock: Object.fromEntries(form.sizes.split(",").map((size) => [size.trim(), 10])),
      images: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
      ],
      featured: Boolean(form.featured),
      newArrival: Boolean(form.newArrival),
      bestseller: Boolean(form.bestseller),
      status: form.status as Product["status"],
      fabric: form.fabric,
      fit: form.fit,
      care: form.care,
      sku: form.sku,
    };

    const withProduct = editId ? products.map((product) => (product.id === editId ? nextProduct : product)) : [nextProduct, ...products];
    saveCatalogProducts(withProduct);
    router.push("/admin/products");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Products</div>
        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">{editId ? "Edit product" : "Add product"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Product name</span>
            <input value={form.name} onChange={(event) => handleChange("name", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">SKU</span>
            <input value={form.sku} onChange={(event) => handleChange("sku", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Gender collection</span>
            <select value={form.gender} onChange={(event) => handleChange("gender", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3">
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Unisex">Unisex</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Category</span>
            <input value={form.category} onChange={(event) => handleChange("category", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Product type</span>
            <input value={form.type} onChange={(event) => handleChange("type", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Status</span>
            <select value={form.status} onChange={(event) => handleChange("status", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3">
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Selling price</span>
            <input type="number" value={form.price} onChange={(event) => handleChange("price", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Original MRP</span>
            <input type="number" value={form.mrp} onChange={(event) => handleChange("mrp", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Description</span>
            <textarea value={form.description} onChange={(event) => handleChange("description", event.target.value)} className="min-h-32 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Available sizes</span>
            <input value={form.sizes} onChange={(event) => handleChange("sizes", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Available colours</span>
            <input value={form.colors} onChange={(event) => handleChange("colors", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Fabric info</span>
            <input value={form.fabric} onChange={(event) => handleChange("fabric", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Fit</span>
            <input value={form.fit} onChange={(event) => handleChange("fit", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-[#63452f]">Care instructions</span>
            <input value={form.care} onChange={(event) => handleChange("care", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required />
          </label>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-[#63452f]">
            <input checked={Boolean(form.newArrival)} onChange={(event) => handleChange("newArrival", event.target.checked)} type="checkbox" />
            New arrival
          </label>
          <label className="flex items-center gap-2 text-sm text-[#63452f]">
            <input checked={Boolean(form.bestseller)} onChange={(event) => handleChange("bestseller", event.target.checked)} type="checkbox" />
            Bestseller
          </label>
          <label className="flex items-center gap-2 text-sm text-[#63452f]">
            <input checked={Boolean(form.featured)} onChange={(event) => handleChange("featured", event.target.checked)} type="checkbox" />
            Featured product
          </label>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Save product
          </button>
        </div>
      </form>
    </div>
  );
}
