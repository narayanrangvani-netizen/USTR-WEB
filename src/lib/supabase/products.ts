import "server-only";

import type { Product, ProductStatus } from "@/lib/products";
import { getSupabaseServiceClient } from "./server";

type CatalogRow = {
  id: string;
  slug: string;
  name: string;
  gender: Product["gender"];
  product_type: string;
  description: string | null;
  selling_price: number;
  original_price: number;
  sku: string;
  status: ProductStatus;
  is_new_arrival: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  fabric: string | null;
  fit: string | null;
  care: string | null;
  colors: string[] | null;
  sizes: string[] | null;
  product_images: { id: string; image_url: string; is_primary: boolean; sort_order: number }[];
  product_variants: {
    color: string;
    size: string;
    inventory: { stock: number }[] | { stock: number } | null;
  }[];
};

function mapProduct(row: CatalogRow): Product {
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((image) => image.image_url);
  const stock: Record<string, number> = {};

  for (const variant of row.product_variants ?? []) {
    if (!(row.colors ?? []).includes(variant.color) || !(row.sizes ?? []).includes(variant.size)) continue;
    const inventory = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
    stock[variant.color] = (stock[variant.color] ?? 0) + (inventory?.stock ?? 0);
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    gender: row.gender,
    category: row.product_type,
    type: row.product_type,
    description: row.description ?? "",
    price: Number(row.selling_price),
    mrp: Number(row.original_price),
    colors: row.colors ?? [],
    sizes: row.sizes ?? [],
    stock,
    images,
    imageIds: [...(row.product_images ?? [])]
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
      .map((image) => image.id),
    featured: row.is_featured,
    newArrival: row.is_new_arrival,
    bestseller: row.is_bestseller,
    status: row.status,
    fabric: row.fabric ?? "",
    fit: row.fit ?? "",
    care: row.care ?? "",
    sku: row.sku,
  };
}

export async function listProducts(options: { includeUnpublished?: boolean } = {}) {
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("products")
    .select("*, product_images(id, image_url, is_primary, sort_order), product_variants(color, size, inventory(stock))")
    .order("created_at", { ascending: false });

  if (!options.includeUnpublished) query = query.eq("status", "Published");

  const { data, error } = await query;
  if (error) throw new Error(`Could not load products: ${error.message}`);
  const products = (data as unknown as CatalogRow[]).map(mapProduct);
  return options.includeUnpublished ? products : products.filter((product) => product.images.length > 0);
}
