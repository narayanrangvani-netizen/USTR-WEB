import { NextResponse } from "next/server";
import { requireStoreOwner } from "@/lib/supabase/server";

const ORDER_STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

export async function GET() {
  const access = await requireStoreOwner();
  if ("response" in access) return access.response;

  try {
    const { data, error } = await access.service.from("orders")
      .select("id, user_id, total_amount, shipping_amount, payment_method, payment_status, order_status, delivery_address, created_at, order_items(quantity, price, products(name))")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Could not load orders: ${error.message}`);
    return NextResponse.json({ orders: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load orders.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const access = await requireStoreOwner();
  if ("response" in access) return access.response;

  try {
    const body = await request.json();
    if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) {
      return NextResponse.json({ error: "A valid order ID is required." }, { status: 400 });
    }
    if (body.orderStatus !== undefined && !ORDER_STATUSES.includes(body.orderStatus)) {
      return NextResponse.json({ error: "Choose a valid order status." }, { status: 400 });
    }
    if (body.paymentStatus !== undefined && body.paymentStatus !== "Confirmed") {
      return NextResponse.json({ error: "Choose a valid payment status." }, { status: 400 });
    }
    if (body.orderStatus === undefined && body.paymentStatus === undefined) {
      return NextResponse.json({ error: "Choose an order or payment status." }, { status: 400 });
    }
    const { error } = await access.service.rpc("update_store_order", {
      p_order_id: body.id,
      p_order_status: body.orderStatus ?? null,
      p_payment_status: body.paymentStatus ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update order." }, { status: 400 });
  }
}
