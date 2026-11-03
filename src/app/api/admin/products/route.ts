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
    console.error("[admin.products] Product list failed", {
      kind: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "Could not load products. Try again." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const access = await requireStoreOwner();
  if ("response" in access) return access.response;

  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Send valid product details." }, { status: 400 });
  }
  if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
    return NextResponse.json({ error: "Send valid product details." }, { status: 400 });
  }

  try {
    const body = parsedBody as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const gender = body.gender;
    const productType = typeof body.category === "string" ? body.category.trim() : "";
    const sku = typeof body.sku === "string" ? body.sku.trim().toUpperCase() : "";
    const price = Number(body.price);
    const mrp = Number(body.mrp);
    const colors = Array.isArray(body.colors) ? body.colors.map((value: unknown) => typeof value === "string" ? value.trim() : "").filter(Boolean) : [];
    const sizes = Array.isArray(body.sizes) ? body.sizes.map((value: unknown) => typeof value === "string" ? value.trim() : "").filter(Boolean) : [];
    const status = body.status;
    const showOnRack = body.showOnRack === undefined ? true : body.showOnRack;
    const rackOrder = body.rackOrder === undefined ? 0 : Number(body.rackOrder);
    const hasProductId = body.id !== undefined;
    const productId = typeof body.id === "string" && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : undefined;
    const stock = body.stock === "" || body.stock === undefined ? undefined : Number(body.stock);
    const variantStock = body.variantStock && typeof body.variantStock === "object" && !Array.isArray(body.variantStock)
      ? body.variantStock as Record<string, unknown>
      : undefined;

    if (
      name.length < 2 ||
      typeof gender !== "string" ||
      !["Men", "Women", "Unisex"].includes(gender) ||
      productType.length < 2 ||
      sku.length < 3 ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(mrp) ||
      mrp < price ||
      (hasProductId && !productId) ||
      typeof status !== "string" ||
      !["Draft", "Published", "Archived"].includes(status) ||
      typeof showOnRack !== "boolean" ||
      !Number.isInteger(rackOrder) ||
      rackOrder < 0 ||
      rackOrder > 10000 ||
      (stock !== undefined && (!Number.isInteger(stock) || stock < 0 || stock > 10000)) ||
      (stock === undefined && !variantStock && !productId) ||
      colors.length < 1 ||
      colors.length > 12 ||
      sizes.length < 1 ||
      sizes.length > 12 ||
      new Set(colors).size !== colors.length ||
      new Set(sizes).size !== sizes.length ||
      (body.variantStock !== undefined && !variantStock)
    ) {
      return NextResponse.json({ error: "Check the product name, SKU, price/MRP, collection, colours, and sizes." }, { status: 400 });
    }
    if (variantStock && Object.entries(variantStock).some(([key, value]) => {
      let pair: unknown;
      try {
        pair = JSON.parse(key);
      } catch {
        return true;
      }
      return !Array.isArray(pair) ||
        pair.length !== 2 ||
        typeof pair[0] !== "string" ||
        typeof pair[1] !== "string" ||
        !colors.includes(pair[0]) ||
        !sizes.includes(pair[1]) ||
        !Number.isInteger(Number(value)) ||
        Number(value) < 0 ||
        Number(value) > 10000;
    })) {
      return NextResponse.json({ error: "Enter a whole-number stock value from 0 to 10000 for each selected colour and size." }, { status: 400 });
    }
    if (!variantStock && stock !== undefined && (!Number.isInteger(stock) || stock < 0 || stock > 10000)) {
      return NextResponse.json({ error: "Starting stock must be a whole number between 0 and 10000." }, { status: 400 });
    }
    if (!variantStock && stock === undefined && !productId) {
      return NextResponse.json({ error: "Enter a starting stock quantity for each product variant." }, { status: 400 });
    }
    if (variantStock && colors.some((color: string) => sizes.some((size: string) => {
      const key = JSON.stringify([color, size]);
      return !Object.prototype.hasOwnProperty.call(variantStock, key);
    }))) {
      return NextResponse.json({ error: "Enter a stock value for every selected colour and size." }, { status: 400 });
    }

    if (status === "Published") {
      return NextResponse.json({ error: "Save the product first, then use Publish product to verify its images and stock." }, { status: 400 });
    }
    const { data: existingCategory, error: categoryError } = await access.service.from("categories")
      .select("id").eq("name", productType).maybeSingle();
    if (categoryError) throw new Error(`Could not check product category: ${categoryError.message}`);
    let categoryId = existingCategory?.id;
    if (!categoryId) {
      const { data, error } = await access.service.from("categories")
        .insert({ name: productType, slug: `${slugify(productType) || "category"}-${crypto.randomUUID().slice(0, 8)}` })
        .select("id").single();
      if (error) throw new Error(`Could not save product category: ${error.message}`);
      categoryId = data.id;
    }
    const product = {
      name,
      gender,
      category_id: categoryId,
      product_type: productType,
      description: typeof body.description === "string" ? body.description.trim() : "",
      selling_price: price,
      original_price: mrp,
      sku,
      status,
      show_on_rack: showOnRack,
      rack_order: rackOrder,
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
    let savedProductSlug = "";
    if (productId) {
      const { data, error } = await access.service.from("products")
        .update(product).eq("id", productId).select("id,slug").single();
      if (error) throw new Error(`Could not update product: ${error.message}`);
      savedProductSlug = data.slug;
    } else {
      const { data, error } = await access.service.from("products").insert({
        ...product,
        slug: `${slugify(name)}-${crypto.randomUUID().slice(0, 8)}`,
      }).select("id,slug").single();
      if (error) throw new Error(`Could not create product: ${error.message}`);
      savedProductId = data.id;
      savedProductSlug = data.slug;
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
      .select("id,color,size");
    if (variantError) throw new Error(`Product saved, but sizes and colours could not be saved: ${variantError.message}`);

    const inventoryRows = savedVariants.flatMap((variant) => {
      const variantKey = JSON.stringify([variant.color, variant.size]);
      const variantValue = variantStock?.[variantKey];
      const quantity = variantValue === undefined ? stock : Number(variantValue);
      return quantity === undefined ? [] : [{
        variant_id: variant.id,
        stock: quantity,
        updated_at: new Date().toISOString(),
      }];
    });
    if (inventoryRows.length) {
      const { error: inventoryError } = await access.service
        .from("inventory")
        .upsert(inventoryRows, { onConflict: "variant_id" });
      if (inventoryError) throw new Error(`Product saved, but stock could not be saved: ${inventoryError.message}`);
    }
    const { data: existingInventory, error: existingError } = await access.service
      .from("inventory").select("variant_id").in("variant_id", savedVariants.map((variant) => variant.id));
    if (existingError) throw new Error(`Product saved, but stock could not be checked: ${existingError.message}`);
    const existingIds = new Set(existingInventory.map((row) => row.variant_id));
    const missing = savedVariants.filter((variant) => !existingIds.has(variant.id)).map((variant) => ({ variant_id: variant.id, stock: 0 }));
    if (missing.length) {
      const { error: missingError } = await access.service.from("inventory").insert(missing);
      if (missingError) throw new Error(`Product saved, but new variant stock could not be initialized: ${missingError.message}`);
    }

    return NextResponse.json({ id: savedProductId, slug: savedProductSlug }, { status: productId ? 200 : 201 });
  } catch (error) {
    console.error("[admin.products] Product save failed", {
      kind: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "Could not save the product. Check your connection and try again." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const access = await requireStoreOwner();
  if ("response" in access) return access.response;
  try {
    const body = await request.json();
    if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) {
      return NextResponse.json({ error: "A valid product ID is required." }, { status: 400 });
    }
    const update: { status?: string; show_on_rack?: boolean; rack_order?: number; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (body.status !== undefined) {
      if (!["Published", "Draft", "Archived"].includes(body.status)) {
        return NextResponse.json({ error: "Choose a valid product status." }, { status: 400 });
      }
      update.status = body.status;
    }
    if (body.showOnRack !== undefined) {
      if (typeof body.showOnRack !== "boolean") {
        return NextResponse.json({ error: "Rack visibility must be enabled or disabled." }, { status: 400 });
      }
      update.show_on_rack = body.showOnRack;
    }
    if (body.rackOrder !== undefined) {
      const rackOrder = Number(body.rackOrder);
      if (!Number.isInteger(rackOrder) || rackOrder < 0 || rackOrder > 10000) {
        return NextResponse.json({ error: "Rack order must be a whole number between 0 and 10000." }, { status: 400 });
      }
      update.rack_order = rackOrder;
    }
    if (Object.keys(update).length === 1) {
      return NextResponse.json({ error: "Provide a product status or rack setting to update." }, { status: 400 });
    }
    if (update.status === "Published") {
      const { count, error: imageError } = await access.service
        .from("product_images").select("id", { count: "exact", head: true }).eq("product_id", body.id);
      if (imageError) {
        console.error("[admin.products] Image check failed", { code: imageError.code ?? "unknown" });
        return NextResponse.json({ error: "Could not verify product images. Try again." }, { status: 503 });
      }
      if (!count) return NextResponse.json({ error: "Upload at least one product photo before publishing this item." }, { status: 400 });
      const { data: variants, error: variantError } = await access.service
        .from("product_variants").select("id").eq("product_id", body.id);
      if (variantError) {
        console.error("[admin.products] Variant check failed", { code: variantError.code ?? "unknown" });
        return NextResponse.json({ error: "Could not verify product availability. Try again." }, { status: 503 });
      }
      if (!variants.length) return NextResponse.json({ error: "Add at least one colour and size before publishing." }, { status: 400 });
      const { data: inventory, error: inventoryError } = await access.service
        .from("inventory").select("stock").in("variant_id", variants.map((variant) => variant.id)).gt("stock", 0);
      if (inventoryError) {
        console.error("[admin.products] Inventory check failed", { code: inventoryError.code ?? "unknown" });
        return NextResponse.json({ error: "Could not verify product availability. Try again." }, { status: 503 });
      }
      if (!inventory.length) return NextResponse.json({ error: "Set stock for at least one variant before publishing." }, { status: 400 });
    }
    const { error } = await access.service.from("products")
      .update(update)
      .eq("id", body.id);
    if (error) {
      console.error("[admin.products] Product status update failed", { code: error.code ?? "unknown" });
      return NextResponse.json({ error: "Could not update the product. Try again." }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin.products] Product status update failed", {
      kind: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "Could not update the product. Try again." }, { status: 503 });
  }
}
