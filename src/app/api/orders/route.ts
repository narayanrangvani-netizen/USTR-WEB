import { NextResponse } from "next/server";
import { getCurrentStoreUser, getSupabaseServiceClient } from "@/lib/supabase/server";

const isNonEmptyString = (value: unknown) => typeof value === "string" && value.trim().length > 0;

export async function POST(request: Request) {
  try {
    const current = await getCurrentStoreUser();
    if (!current) return NextResponse.json({ error: "Sign in before placing your order." }, { status: 401 });

    const body = await request.json();
    const address = body.address;
    const items = body.items;
    if (
      !address ||
      !isNonEmptyString(address.full_name) ||
      !isNonEmptyString(address.phone) ||
      !isNonEmptyString(address.address_line_1) ||
      !isNonEmptyString(address.city) ||
      !isNonEmptyString(address.state) ||
      !/^\d{6}$/.test(String(address.postal_code ?? "")) ||
      !Array.isArray(items) ||
      items.length < 1 ||
      items.length > 50 ||
      items.some((item: unknown) =>
        !item ||
        typeof item !== "object" ||
        typeof (item as Record<string, unknown>).productId !== "string" ||
        !/^[0-9a-f-]{36}$/i.test((item as Record<string, unknown>).productId as string) ||
        !isNonEmptyString((item as Record<string, unknown>).color) ||
        !isNonEmptyString((item as Record<string, unknown>).size) ||
        !Number.isInteger((item as Record<string, unknown>).quantity) ||
        Number((item as Record<string, unknown>).quantity) < 1 ||
        Number((item as Record<string, unknown>).quantity) > 10
      )
    ) {
      return NextResponse.json({ error: "Enter a complete delivery address and check your cart items." }, { status: 400 });
    }

    const orderItems = items.map((item: Record<string, unknown>) => ({
      product_id: item.productId,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
    }));

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.rpc("create_store_order", {
      p_user_id: current.user.id,
      p_items: orderItems,
      p_delivery_address: {
        full_name: String(address.full_name).trim(),
        phone: String(address.phone).trim(),
        address_line_1: String(address.address_line_1).trim(),
        address_line_2: isNonEmptyString(address.address_line_2) ? address.address_line_2.trim() : "",
        city: String(address.city).trim(),
        state: String(address.state).trim(),
        postal_code: String(address.postal_code).trim(),
        country: "India",
      },
    });

    if (error) {
      const message = error.message.includes("stock") || error.message.includes("available")
        ? error.message
        : "Your order could not be placed. Please check your cart and delivery address.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ orderId: data, paymentMethod: "cod", paymentStatus: "Pending" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not place your order.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
