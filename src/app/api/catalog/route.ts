import { NextResponse } from "next/server";
import { listProducts } from "@/lib/supabase/products";

export async function GET() {
  try {
    return NextResponse.json({ products: await listProducts() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load the catalog.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
