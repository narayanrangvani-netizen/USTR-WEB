import { NextResponse } from "next/server";
import { requireStoreOwner } from "@/lib/supabase/server";

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function GET() {
  const access = await requireStoreOwner();
  if ("response" in access) return access.response;

  const [categoryResult, productResult] = await Promise.all([
    access.service.from("categories").select("id, name, slug").order("name", { ascending: true }),
    access.service.from("products").select("product_type"),
  ]);
  if (categoryResult.error || productResult.error) {
    console.error("[admin.categories] Category list failed", {
      code: categoryResult.error?.code ?? productResult.error?.code ?? "unknown",
    });
    return NextResponse.json({ error: "Could not load categories. Try again." }, { status: 503 });
  }
  const categoriesByName = new Map(categoryResult.data.map((category) => [category.name, category]));
  for (const product of productResult.data) {
    if (product.product_type && !categoriesByName.has(product.product_type)) {
      categoriesByName.set(product.product_type, {
        id: `existing-${product.product_type}`,
        name: product.product_type,
        slug: "",
      });
    }
  }
  return NextResponse.json({
    categories: [...categoriesByName.values()].sort((first, second) => first.name.localeCompare(second.name)),
  });
}

export async function POST(request: Request) {
  const access = await requireStoreOwner();
  if ("response" in access) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a category name." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || !("name" in body) || typeof body.name !== "string") {
    return NextResponse.json({ error: "Enter a category name." }, { status: 400 });
  }
  const name = body.name.trim();
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Category names must be between 2 and 80 characters." }, { status: 400 });
  }

  const { data: existing, error: existingError } = await access.service
    .from("categories")
    .select("id, name, slug")
    .eq("name", name)
    .maybeSingle();
  if (existingError) {
    console.error("[admin.categories] Category lookup failed", { code: existingError.code ?? "unknown" });
    return NextResponse.json({ error: "Could not save this category. Try again." }, { status: 503 });
  }
  if (existing) return NextResponse.json({ category: existing });

  const slugBase = slugify(name) || "category";
  const { data: category, error } = await access.service
    .from("categories")
    .insert({ name, slug: `${slugBase}-${crypto.randomUUID().slice(0, 8)}` })
    .select("id, name, slug")
    .single();
  if (error) {
    console.error("[admin.categories] Category creation failed", { code: error.code ?? "unknown" });
    return NextResponse.json({ error: "Could not save this category. Try again." }, { status: 503 });
  }
  return NextResponse.json({ category }, { status: 201 });
}
