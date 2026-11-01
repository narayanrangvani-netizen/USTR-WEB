"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { fetchProducts, type Product } from "@/lib/products";

type ProductForm = {
  name: string;
  category: string;
  customCategory: string;
  gender: Product["gender"];
  description: string;
  price: string;
  mrp: string;
  colors: string;
  sizes: string;
  stock: string;
  sku: string;
  fabric: string;
  fit: string;
  care: string;
  status: Product["status"];
  showOnRack: boolean;
  rackOrder: string;
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  category: "T-shirts",
  customCategory: "",
  gender: "Men",
  description: "",
  price: "",
  mrp: "",
  colors: "",
  sizes: "",
  stock: "10",
  sku: "",
  fabric: "",
  fit: "",
  care: "",
  status: "Draft",
  showOnRack: true,
  rackOrder: "0",
  featured: false,
  newArrival: false,
  bestseller: false,
};

export default function AddProductPage() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [previewFileUrl, setPreviewFileUrl] = useState("");
  const [images, setImages] = useState<{ id: string; url: string; role: string; color: string | null }[]>([]);
  const [imageRole, setImageRole] = useState<"side" | "front" | "back" | "colorway">("front");
  const [imageColor, setImageColor] = useState("");
  const [loadingProduct, setLoadingProduct] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const previewImage = previewFileUrl || images.find((image) => image.role === "front")?.url || images[0]?.url;

  useEffect(() => {
    return () => {
      if (previewFileUrl) URL.revokeObjectURL(previewFileUrl);
    };
  }, [previewFileUrl]);

  useEffect(() => {
    if (!editId) return;
    fetchProducts(true)
      .then((products) => {
        const product = products.find((entry) => entry.id === editId);
        if (!product) throw new Error("This product could not be found.");
        setForm({
          name: product.name,
          category: ["T-shirts", "Shirts"].includes(product.category) ? product.category : "Other",
          customCategory: ["T-shirts", "Shirts"].includes(product.category) ? "" : product.category,
          gender: product.gender,
          description: product.description,
          price: String(product.price),
          mrp: String(product.mrp),
          colors: product.colors.join(", "),
          sizes: product.sizes.join(", "),
          stock: "",
          sku: product.sku,
          fabric: product.fabric,
          fit: product.fit,
          care: product.care,
          status: product.status,
          showOnRack: product.showOnRack,
          rackOrder: String(product.rackOrder),
          featured: product.featured,
          newArrival: product.newArrival,
          bestseller: product.bestseller,
        });
        setImages(product.images.flatMap((url, index) => {
          const id = product.imageIds?.[index];
          const detail = product.imageDetails?.find((image) => image.id === id);
          return id ? [{ id, url, role: detail?.role ?? "front", color: detail?.color ?? null }] : [];
        }));
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load product."))
      .finally(() => setLoadingProduct(false));
  }, [editId]);

  function setField<K extends keyof ProductForm>(field: K, value: ProductForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function setProductFiles(nextFiles: File[]) {
    if (previewFileUrl) URL.revokeObjectURL(previewFileUrl);
    setPreviewFileUrl(nextFiles[0] ? URL.createObjectURL(nextFiles[0]) : "");
    setFiles(nextFiles);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...(editId ? { id: editId } : {}),
        ...form,
        category: form.category === "Other" ? form.customCategory.trim() : form.category,
        rackOrder: Number(form.rackOrder),
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: form.stock === "" && editId ? "" : Number(form.stock),
        colors: form.colors.split(",").map((value) => value.trim()).filter(Boolean),
        sizes: form.sizes.split(",").map((value) => value.trim()).filter(Boolean),
      };
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not save product.");

      for (const file of files) {
        const data = new FormData();
        data.set("file", file);
        data.set("role", imageRole);
        if (imageRole === "colorway") data.set("color", imageColor);
        const upload = await fetch(`/api/admin/products/${body.id}/images`, { method: "POST", body: data });
        const uploadBody = await upload.json();
        if (!upload.ok) throw new Error(uploadBody.error ?? "Product saved, but an image could not be uploaded.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  async function removeImage(id: string) {
    setError("");
    const response = await fetch(`/api/admin/images/${id}`, { method: "DELETE" });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Could not remove image.");
      return;
    }
    setImages((current) => current.filter((image) => image.id !== id));
  }

  if (loadingProduct) return <p className="p-6 text-[#63452f]">Loading product…</p>;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Products</div>
        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">{editId ? "Edit product" : "Add product"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Product name</span><input value={form.name} onChange={(event) => setField("name", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" minLength={2} required /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">SKU</span><input value={form.sku} onChange={(event) => setField("sku", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" minLength={3} required /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Gender collection</span><select value={form.gender} onChange={(event) => setField("gender", event.target.value as Product["gender"])} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3"><option value="Men">Men</option><option value="Women">Women</option><option value="Unisex">Unisex</option></select></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Category</span><select value={form.category} onChange={(event) => setField("category", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required><option value="T-shirts">T-shirts</option><option value="Shirts">Shirts</option><option value="Other">Other category</option></select></label>
          {form.category === "Other" && <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Custom category</span><input value={form.customCategory} onChange={(event) => setField("customCategory", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" minLength={2} placeholder="e.g. Jackets" required /></label>}
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Status</span><select value={form.status} onChange={(event) => setField("status", event.target.value as Product["status"])} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3"><option value="Draft">Draft</option><option value="Published">Published</option><option value="Archived">Archived</option></select></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Selling price (₹)</span><input type="number" min="1" step="0.01" value={form.price} onChange={(event) => setField("price", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Original MRP (₹)</span><input type="number" min="1" step="0.01" value={form.mrp} onChange={(event) => setField("mrp", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">{editId ? "Set stock for every variant (optional)" : "Starting stock per size/colour"}</span><input type="number" min="0" max="10000" value={form.stock} onChange={(event) => setField("stock", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required={!editId} /><span className="mt-1 block text-xs text-[#63452f]">{editId ? "Leave blank to keep each size and colour’s current stock." : "This quantity is applied to every size/colour combination."}</span></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm font-medium text-[#63452f]">Description</span><textarea value={form.description} onChange={(event) => setField("description", event.target.value)} className="min-h-32 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm font-medium text-[#63452f]">Available sizes (comma separated)</span><input value={form.sizes} onChange={(event) => setField("sizes", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" placeholder="S, M, L, XL" required /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm font-medium text-[#63452f]">Available colours (comma separated)</span><input value={form.colors} onChange={(event) => setField("colors", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" placeholder="Black, Sand" required /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Fabric info</span><input value={form.fabric} onChange={(event) => setField("fabric", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Fit</span><input value={form.fit} onChange={(event) => setField("fit", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm font-medium text-[#63452f]">Care instructions</span><input value={form.care} onChange={(event) => setField("care", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" /></label>
        </div>

        <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
          <div><h2 className="font-semibold text-[#29221d]">Product photos</h2><p className="mt-1 text-sm text-[#63452f]">JPG, PNG, or WebP; up to 5 MB per photo. Add at least one photo before publishing.</p></div>
          {images.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((image) => (
            <div key={image.id} className="relative"><Image src={image.url} alt={`${image.role} product view${image.color ? `, ${image.color}` : ""}`} width={288} height={144} unoptimized className="h-36 w-full rounded-xl object-contain bg-[#f2e9dd]" /><div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[10px] uppercase text-[#29221d]">{image.role}{image.color ? ` · ${image.color}` : ""}</div><button type="button" onClick={() => void removeImage(image.id)} className="absolute right-2 top-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 shadow">Remove</button></div>
          ))}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Image view</span><select value={imageRole} onChange={(event) => setImageRole(event.target.value as typeof imageRole)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3"><option value="front">Front</option><option value="side">Side</option><option value="back">Back</option><option value="colorway">Colourway</option></select></label>
            {imageRole === "colorway" && <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Colour for these images</span><select value={imageColor} onChange={(event) => setImageColor(event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required><option value="">Select a product colour</option>{form.colors.split(",").map((color) => color.trim()).filter(Boolean).map((color) => <option key={color} value={color}>{color}</option>)}</select></label>}
          </div>
          <label className="block"><span className="sr-only">Choose product photos</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setProductFiles(Array.from(event.target.files ?? []))} className="block w-full text-sm text-[#63452f] file:mr-4 file:rounded-full file:border-0 file:bg-[#29221d] file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white" /></label>
          {files.length > 0 && <p className="text-sm text-[#63452f]">{files.length} {imageRole} photo{files.length === 1 ? "" : "s"} selected. They upload when you save.</p>}
        </section>

        <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><h2 className="font-semibold text-[#29221d]">Showroom rack</h2><p className="mt-1 text-sm text-[#63452f]">Only published products with uploaded images appear. Up to 10 products are shown per rack page, in order.</p></div>
          <label className="flex items-center gap-3 text-sm text-[#63452f]"><input checked={form.showOnRack} onChange={(event) => setField("showOnRack", event.target.checked)} type="checkbox" />Show on clothing rack</label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">Rack display order</span><input type="number" min="0" max="10000" value={form.rackOrder} onChange={(event) => setField("rackOrder", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" /></label>
          <div className="rack-product-preview sm:col-span-2">
            <div className="rack-product-preview-image">
              {previewImage ? <Image src={previewImage} alt={`${form.name || "Product"} showroom preview`} fill sizes="112px" unoptimized /> : <span>Upload a front photo to preview</span>}
            </div>
            <div>
              <p className="rack-product-preview-eyebrow">{form.gender} · {form.category === "Other" ? form.customCategory || "Collection" : form.category}</p>
              <p className="rack-product-preview-name">{form.name || "New garment"}</p>
              {form.price && <p className="rack-product-preview-price">₹{Number(form.price).toLocaleString("en-IN")}</p>}
              <p className="rack-product-preview-note">Preview uses the actual photo selected above; no sample garment is shown.</p>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-[#63452f]"><input checked={form.newArrival} onChange={(event) => setField("newArrival", event.target.checked)} type="checkbox" />New arrival</label>
          <label className="flex items-center gap-2 text-sm text-[#63452f]"><input checked={form.bestseller} onChange={(event) => setField("bestseller", event.target.checked)} type="checkbox" />Bestseller</label>
          <label className="flex items-center gap-2 text-sm text-[#63452f]"><input checked={form.featured} onChange={(event) => setField("featured", event.target.checked)} type="checkbox" />Featured product</label>
        </div>
        {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        <div className="flex justify-end"><button type="submit" disabled={saving} className="rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60">{saving ? "Saving…" : "Save product"}</button></div>
      </form>
    </div>
  );
}
