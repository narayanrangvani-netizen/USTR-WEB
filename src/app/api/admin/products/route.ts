import { NextResponse } from "next/server";
import { requireStoreOwner } from "@/lib/supabase/server";
import { listProducts } from "@/lib/supabase/products";

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function GET() {
  const access = await requireStoreOwner();
  if ("response" in access) return access.response;

  try {
    return NextResponse.json({ products: await listProducts({ includeUnpublished: true }) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load products.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const access = await requireStoreOwner();
  if ("response" in access) return access.response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const gender = body.gender;
    const productType = typeof body.category === "string" ? body.category.trim() : "";
    const sku = typeof body.sku === "string" ? body.sku.trim().toUpperCase() : "";
    const price = Number(body.price);
    const mrp = Number(body.mrp);
    const colors = Array.isArray(body.colors) ? body.colors.map((value: unknown) => typeof value === "string" ? value.trim() : "").filter(Boolean) : [];
    const sizes = Array.isArray(body.sizes) ? body.sizes.map((value: unknown) => typeof value === "string" ? value.trim() : "").filter(Boolean) : [];
    const status = body.status;
    const hasProductId = body.id !== undefined;
    const productId = typeof body.id === "string" && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : undefined;
    const stock = body.stock === "" && productId ? undefined : Number(body.stock);

    if (
      name.length < 2 ||
      !["Men", "Women", "Unisex"].includes(gender) ||
      productType.length < 2 ||
      sku.length < 3 ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(mrp) ||
      mrp < price ||
      (hasProductId && !productId) ||
      !["Draft", "Published", "Archived"].includes(status) ||
      (stock !== undefined && (!Number.isInteger(stock) || stock < 0 || stock > 10000)) ||
      (stock === undefined && !productId) ||
      colors.length < 1 ||
      colors.length > 12 ||
      sizes.length < 1 ||
      sizes.length > 12 ||
      new Set(colors).size !== colors.length ||
      new Set(sizes).size !== sizes.length
    ) {
      return NextResponse.json({ error: "Check the product name, SKU, price/MRP, collection, colours, and sizes." }, { status: 400 });
    }

    if (status === "Published" && !productId) {
      return NextResponse.json({ error: "Save this item as a draft, upload at least one product photo, then publish it." }, { status: 400 });
    }
    if (status === "Published" && productId) {
      const { count, error: imageError } = await access.service
        .from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
      if (imageError) throw new Error(`Could not check product images: ${imageError.message}`);
      if (!count) return NextResponse.json({ error: "Upload at least one product photo before publishing this item." }, { status: 400 });
    }
    const product = {
      name,
      slug: `${slugify(name)}${productId ? "" : `-${crypto.randomUUID().slice(0, 8)}`}`,
      gender,
      product_type: productType,
      description: typeof body.description === "string" ? body.description.trim() : "",
      selling_price: price,
      original_price: mrp,
      sku,
      status,
      is_featured: body.featured === true,
      is_new_arrival: body.newArrival === true,
      is_bestseller: body.bestseller === true,
      fabric: typeof body.fabric === "string" ? body.fabric.trim() : "",
      fit: typeof body.fit === "string" ? body.fit.trim() : "",
      care: typeof body.care === "string" ? body.care.trim() : "",
      colors,
      sizes,
      updated_at: new Date().toISOString(),
    };

    let savedProductId = productId;
    if (productId) {
      const { error } = await access.service.from("products").update(product).eq("id", productId);
      if (error) throw new Error(`Could not update product: ${error.message}`);
    } else {
      const { data, error } = await access.service.from("products").insert(product).select("id").single();
      if (error) throw new Error(`Could not create product: ${error.message}`);
      savedProductId = data.id;
    }

    if (!savedProductId) throw new Error("The product was saved without an ID.");
    const variants = colors.flatMap((color: string) =>
      sizes.map((size: string) => ({
        product_id: savedProductId,
        color,
        size,
        sku: `${slugify(sku)}-${slugify(color)}-${slugify(size)}`,
      })),
    );
    const { data: savedVariants, error: variantError } = await access.service
      .from("product_variants")
      .upsert(variants, { onConflict: "product_id,color,size" })
      .select("id");
    if (variantError) throw new Error(`Product saved, but sizes and colours could not be saved: ${variantError.message}`);

    if (stock !== undefined) {
      const inventoryRows = savedVariants.map((variant) => ({
        variant_id: variant.id,
        stock,
        updated_at: new Date().toISOString(),
      }));
      const { error: inventoryError } = await access.service
        .from("inventory")
        .upsert(inventoryRows, { onConflict: "variant_id" });
      if (inventoryError) throw new Error(`Product saved, but stock could not be saved: ${inventoryError.message}`);
    } else {
      const { data: existingInventory, error: existingError } = await access.service
        .from("inventory").select("variant_id").in("variant_id", savedVariants.map((variant) => variant.id));
      if (existingError) throw new Error(`Product saved, but stock could not be checked: ${existingError.message}`);
      const existingIds = new Set(existingInventory.map((row) => row.variant_id));
      const missing = savedVariants.filter((variant) => !existingIds.has(variant.id)).map((variant) => ({ variant_id: variant.id, stock: 0 }));
      if (missing.length) {
        const { error: missingError } = await access.service.from("inventory").insert(missing);
        if (missingError) throw new Error(`Product saved, but new variant stock could not be initialized: ${missingError.message}`);
      }
    }

    return NextResponse.json({ id: savedProductId }, { status: productId ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const access = await requireStoreOwner();
  if ("response" in access) return access.response;
  try {
    const body = await request.json();
    if (typeof body.id !== "string" || !["Published", "Draft", "Archived"].includes(body.status)) {
      return NextResponse.json({ error: "A product ID and valid status are required." }, { status: 400 });
    }
    if (body.status === "Published") {
      const { count, error: imageError } = await access.service
        .from("product_images").select("id", { count: "exact", head: true }).eq("product_id", body.id);
      if (imageError) return NextResponse.json({ error: imageError.message }, { status: 400 });
      if (!count) return NextResponse.json({ error: "Upload at least one product photo before publishing this item." }, { status: 400 });
    }
    const { error } = await access.service.from("products")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update product status." }, { status: 400 });
  }
}
