"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchProducts, type Product } from "@/lib/products";

type Order = {
  id: string;
  total_amount: number;
  order_status: string;
  created_at: string;
  delivery_address: { full_name?: string } | null;
};

const statLabels = ["Total products", "Published", "Draft", "Archived", "Inventory units", "Low-stock colours", "Out of stock"];

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchProducts(true),
      fetch("/api/admin/orders").then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load orders.");
        return body.orders as Order[];
      }),
    ])
      .then(([catalog, loadedOrders]) => { setProducts(catalog); setOrders(loadedOrders); })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load the dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const stockValues = products.flatMap((product) => Object.values(product.stock));
    return [
      products.length,
      products.filter((item) => item.status === "Published").length,
      products.filter((item) => item.status === "Draft").length,
      products.filter((item) => item.status === "Archived").length,
      stockValues.reduce((sum, count) => sum + count, 0),
      stockValues.filter((count) => count > 0 && count < 5).length,
      stockValues.filter((count) => count === 0).length,
    ];
  }, [products]);

  return (
    <div className="space-y-8">
      <div><div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Overview</div><h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Owner dashboard</h1></div>
      {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {loading ? <p className="text-[#63452f]">Loading store data…</p> : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statLabels.map((label, index) => <div key={label} className="rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-5"><div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#63452f]">{label}</div><div className="mt-4 text-3xl font-bold text-[#29221d]">{summary[index]}</div></div>)}
            <div className="rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-5"><div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#63452f]">Orders</div><div className="mt-4 text-3xl font-bold text-[#29221d]">{orders.length}</div><p className="mt-2 text-xs text-[#63452f]">Recent orders loaded</p></div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-stone-200 bg-white p-5">
              <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#63452f]">Recent orders</div>
              {orders.length ? <div className="space-y-3">{orders.slice(0, 4).map((order) => <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#f9f3ee] p-4"><div><div className="font-semibold text-[#29221d]">#{order.id.slice(0, 8).toUpperCase()}</div><div className="text-sm text-[#63452f]">{order.delivery_address?.full_name || "Customer"}</div></div><div className="text-right"><div className="font-semibold text-[#29221d]">₹{Number(order.total_amount).toFixed(2)}</div><div className="text-xs uppercase tracking-[0.18em] text-[#63452f]">{order.order_status}</div></div></div>)}</div> : <p className="rounded-2xl bg-[#f9f3ee] p-4 text-sm text-[#63452f]">No customer orders have been placed yet.</p>}
            </div>
            <div className="rounded-[28px] border border-stone-200 bg-[#f2e9dd] p-5"><div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#63452f]">Quick actions</div><div className="mt-5 space-y-3"><Link href="/admin/add-product" className="block rounded-2xl bg-[#29221d] px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white">Add product</Link><Link href="/admin/products" className="block rounded-2xl border border-stone-300 bg-white px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#29221d]">Review catalog</Link><Link href="/admin/orders" className="block rounded-2xl border border-stone-300 bg-white px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#29221d]">Process orders</Link></div></div>
          </div>
        </>
      )}
    </div>
  );
}
