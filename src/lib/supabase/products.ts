import "server-only";

import type { Product, ProductImage, ProductStatus } from "@/lib/products";
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
  show_on_rack: boolean;
  rack_order: number;
  product_images: {
    id: string;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
    image_role: ProductImage["role"];
    image_color: string | null;
  }[];
  product_variants: {
    color: string;
    size: string;
    inventory: { stock: number }[] | { stock: number } | null;
  }[];
};

function mapProduct(row: CatalogRow): Product {
  const sortedImages = [...(row.product_images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
  const images = sortedImages.map((image) => image.image_url);
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
    imageIds: sortedImages.map((image) => image.id),
    imageDetails: sortedImages.map((image) => ({
      id: image.id,
      url: image.image_url,
      role: image.image_role,
      color: image.image_color,
    })),
    showOnRack: row.show_on_rack,
    rackOrder: row.rack_order,
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
    .select("*, product_images(id, image_url, is_primary, sort_order, image_role, image_color), product_variants(color, size, inventory(stock))")
    .order("rack_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!options.includeUnpublished) query = query.eq("status", "Published");

  const { data, error } = await query;
  if (error) throw new Error(`Could not load products: ${error.message}`);
  const products = (data as unknown as CatalogRow[]).map(mapProduct);
  return options.includeUnpublished ? products : products.filter((product) => product.images.length > 0);
}
