export type ProductStatus = "Published" | "Draft" | "Archived";

const PRODUCT_STATUS_VALUES: ProductStatus[] = ["Published", "Draft", "Archived"];

export type Product = {
  id: string;
  slug: string;
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
  images: string[];
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
  status: ProductStatus;
  fabric: string;
  fit: string;
  care: string;
  sku: string;
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    slug: "oversized-signature-tee",
    name: "Oversized Signature Tee",
    gender: "Men",
    category: "Oversized T-shirts",
    type: "Graphic T-shirts",
    description:
      "An oversized everyday tee with an elevated drape, premium cotton feel, and statement-making print for urban layering.",
    price: 999,
    mrp: 1499,
    colors: ["Black", "Sand", "Stone"],
    sizes: ["S", "M", "L", "XL"],
    stock: { Black: 10, Sand: 8, Stone: 6 },
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
    ],
    featured: true,
    newArrival: true,
    bestseller: true,
    status: "Published",
    fabric: "100% premium cotton jersey",
    fit: "Relaxed oversized fit with dropped shoulder",
    care: "Machine wash cold, inside out, air dry",
    sku: "UST-001-BLK",
  },
  {
    id: "prod-002",
    slug: "urban-ridge-shirt",
    name: "Urban Ridge Shirt",
    gender: "Men",
    category: "Casual shirts",
    type: "Casual shirts",
    description:
      "A clean structured shirt cut for everyday movement, with a polished finish and elevated casual styling.",
    price: 1499,
    mrp: 2199,
    colors: ["Mocha", "Cream"],
    sizes: ["M", "L", "XL"],
    stock: { Mocha: 7, Cream: 4 },
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    ],
    featured: false,
    newArrival: true,
    bestseller: false,
    status: "Published",
    fabric: "Cotton twill weave",
    fit: "Modern, lightly relaxed silhouette",
    care: "Cold wash with like colors",
    sku: "UST-002-MCH",
  },
  {
    id: "prod-003",
    slug: "noir-utility-polo",
    name: "Noir Utility Polo",
    gender: "Men",
    category: "Polo T-shirts",
    type: "Polo T-shirts",
    description:
      "A refined polo with utility-inspired details, built for elevated everyday wear and all-day comfort.",
    price: 1299,
    mrp: 1899,
    colors: ["Black", "Olive"],
    sizes: ["S", "M", "L", "XL"],
    stock: { Black: 9, Olive: 5 },
    images: [
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
    ],
    featured: true,
    newArrival: false,
    bestseller: true,
    status: "Published",
    fabric: "Cotton pique knit",
    fit: "Tailored but relaxed",
    care: "Gentle machine wash",
    sku: "UST-003-BLK",
  },
  {
    id: "prod-004",
    slug: "sandstone-drape-top",
    name: "Sandstone Drape Top",
    gender: "Women",
    category: "Oversized T-shirts",
    type: "Graphic T-shirts",
    description:
      "A fluid oversized tee with a soft drape and subtle statement typography for effortless day-to-night styling.",
    price: 1099,
    mrp: 1699,
    colors: ["Sand", "Ivory", "Cocoa"],
    sizes: ["XS", "S", "M", "L"],
    stock: { Sand: 11, Ivory: 9, Cocoa: 6 },
    images: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    ],
    featured: true,
    newArrival: true,
    bestseller: true,
    status: "Published",
    fabric: "Heavyweight cotton blend",
    fit: "Relaxed drape and boxy proportions",
    care: "Wash cold, do not tumble dry",
    sku: "UST-004-SND",
  },
  {
    id: "prod-005",
    slug: "moss-luxe-shirt",
    name: "Moss Luxe Shirt",
    gender: "Women",
    category: "Relaxed-fit shirts",
    type: "Casual shirts",
    description:
      "A relaxed-fit button shirt crafted for movement and layering with a premium, soft-touch finish.",
    price: 1699,
    mrp: 2399,
    colors: ["Moss", "Cream"],
    sizes: ["S", "M", "L", "XL"],
    stock: { Moss: 8, Cream: 5 },
    images: [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    ],
    featured: false,
    newArrival: true,
    bestseller: false,
    status: "Published",
    fabric: "Soft-touch cotton poplin",
    fit: "Easy relaxed silhouette",
    care: "Machine wash cold",
    sku: "UST-005-MOS",
  },
  {
    id: "prod-006",
    slug: "expression-oversized-crew",
    name: "Expression Oversized Crew",
    gender: "Unisex",
    category: "Printed tops",
    type: "Graphic T-shirts",
    description:
      "A statement crew built for expressive styling, oversized comfort, and premium everyday wear.",
    price: 1199,
    mrp: 1799,
    colors: ["Black", "Beige", "Stone"],
    sizes: ["S", "M", "L", "XL"],
    stock: { Black: 10, Beige: 7, Stone: 6 },
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
    ],
    featured: true,
    newArrival: false,
    bestseller: true,
    status: "Published",
    fabric: "Cotton-rich premium knit",
    fit: "Oversized boxy silhouette",
    care: "Cold wash, line dry",
    sku: "UST-006-BLK",
  },
];

function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === "string" && PRODUCT_STATUS_VALUES.includes(value as ProductStatus);
}

export function getCatalogProducts(): Product[] {
  if (typeof window === "undefined") return DEFAULT_PRODUCTS;

  try {
    const saved = window.localStorage.getItem("ustr-products");
    if (!saved) return DEFAULT_PRODUCTS;

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_PRODUCTS;

    return parsed.filter((item): item is Product => {
      if (!item || typeof item !== "object") return false;
      const product = item as Partial<Product>;
      return (
        typeof product.id === "string" &&
        typeof product.slug === "string" &&
        typeof product.name === "string" &&
        typeof product.category === "string" &&
        typeof product.price === "number" &&
        typeof product.mrp === "number" &&
        Array.isArray(product.colors) &&
        Array.isArray(product.sizes) &&
        isProductStatus(product.status)
      );
    });
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

export function saveCatalogProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("ustr-products", JSON.stringify(products));
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
