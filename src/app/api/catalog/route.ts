import { NextResponse } from "next/server";
import { listProducts } from "@/lib/supabase/products";

export async function GET() {
  try {
    return NextResponse.json({ products: await listProducts() });
  } catch (error) {
    console.error("[catalog] Product list failed", {
      kind: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "The catalog is temporarily unavailable." }, { status: 503 });
  }
}
