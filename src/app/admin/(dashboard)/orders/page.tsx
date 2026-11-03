"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  total_amount: number;
  shipping_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  delivery_address: {
    full_name?: string;
    phone?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  } | null;
  order_items: {
    quantity: number;
    price: number;
    products: { name: string } | null;
    product_variants: { color: string; size: string } | null;
  }[];
};

const orderStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load orders.");
        setOrders(body.orders);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load orders."))
      .finally(() => setLoading(false));
  }, []);

  async function updateOrder(id: string, updates: { orderStatus?: string; paymentStatus?: string }) {
    setError("");
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Could not update order.");
      return;
    }
    setOrders((current) => current.map((order) => order.id !== id ? order : {
      ...order,
      ...(updates.orderStatus ? { order_status: updates.orderStatus } : {}),
      ...(updates.paymentStatus ? { payment_status: updates.paymentStatus } : {}),
    }));
  }

  return (
    <div className="space-y-6">
      <div><div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Orders</div><h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Order management</h1></div>
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {loading ? <p className="text-[#63452f]">Loading customer orders…</p> : orders.length ? (
        <div className="space-y-4">{orders.map((order) => {
          const address = order.delivery_address;
          return (
            <article key={order.id} className="space-y-5 rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div><div className="font-semibold text-[#29221d]">Order #{order.id.slice(0, 8).toUpperCase()}</div><div className="text-sm text-[#63452f]">{new Date(order.created_at).toLocaleString("en-IN")}</div></div>
                <div className="text-lg font-semibold text-[#29221d]">₹{Number(order.total_amount).toFixed(2)} <span className="text-xs font-normal text-[#63452f]">(shipping ₹{Number(order.shipping_amount).toFixed(2)})</span></div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div><h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#63452f]">Delivery address</h2><p className="mt-2 text-sm leading-6 text-[#29221d]">{address?.full_name}<br />{address?.phone}<br />{address?.address_line_1}{address?.address_line_2 ? `, ${address.address_line_2}` : ""}<br />{address?.city}, {address?.state} {address?.postal_code}</p></div>
                <div><h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#63452f]">Items</h2><ul className="mt-2 space-y-1 text-sm text-[#29221d]">{order.order_items.map((item, index) => <li key={`${order.id}-${index}`}>{item.quantity} × {item.products?.name ?? "Product"}{item.product_variants ? ` · ${item.product_variants.color} / ${item.product_variants.size}` : ""} — ₹{Number(item.price).toFixed(2)} each</li>)}</ul><p className="mt-3 text-sm text-[#63452f]">Payment: {order.payment_method === "cod" ? "Cash on delivery" : order.payment_method} · {order.payment_status}</p></div>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-4">
                <label className="text-sm text-[#63452f]">Order status <select value={order.order_status} onChange={(event) => void updateOrder(order.id, { orderStatus: event.target.value })} className="ml-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-[#29221d]">{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                {order.payment_method === "cod" && order.order_status === "Delivered" && order.payment_status !== "Confirmed" && <button onClick={() => void updateOrder(order.id, { paymentStatus: "Confirmed" })} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#29221d]">Mark COD collected</button>}
              </div>
            </article>
          );
        })}</div>
      ) : <p className="rounded-[24px] bg-[#f9f3ee] p-6 text-[#63452f]">Orders placed by customers will appear here.</p>}
    </div>
  );
}
