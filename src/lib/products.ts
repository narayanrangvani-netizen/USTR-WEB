export type ProductStatus = "Published" | "Draft" | "Archived";

export type Product = {
  id: string;
  slug: string;
  createdAt: string;
  name: string;
  gender: "Men" | "Women" | "Unisex";
  category: string;
  type: string;
  description: string;
  price: number;
  mrp: number;
  colors: string[];
  sizes: string[];
  stock: Record<string, number>;
  variantStock: Record<string, number>;
  images: string[];
  imageIds?: string[];
  imageDetails?: ProductImage[];
  showOnRack: boolean;
  rackOrder: number;
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
  status: ProductStatus;
  fabric: string;
  fit: string;
  care: string;
  sku: string;
};

export type ProductImage = {
  id: string;
  url: string;
  role: "side" | "front" | "back" | "colorway";
  color: string | null;
};

export function getVariantStock(product: Product, color: string, size: string) {
  return product.variantStock[JSON.stringify([color, size])] ?? 0;
}

export async function fetchProducts(includeUnpublished = false): Promise<Product[]> {
  const response = await fetch(includeUnpublished ? "/api/admin/products" : "/api/catalog", {
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Could not load products.");
  return body.products as Product[];
}

export function calculateDiscount(product: Pick<Product, "price" | "mrp">) {
  if (!product.mrp || product.mrp <= product.price) return 0;
  return Math.round(((product.mrp - product.price) / product.mrp) * 100);
}

export function getPublishedProducts(products: Product[]) {
  return products.filter((product) => product.status === "Published").length;
}

export function getTotalProducts(products: Product[]) {
  return products.length;
}
