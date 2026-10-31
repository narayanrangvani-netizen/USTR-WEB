"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PRODUCTS, getCatalogProducts, type Product } from "@/lib/products";

const stats = [
  { label: "Total products", key: "total" },
  { label: "Published", key: "published" },
  { label: "Draft", key: "draft" },
  { label: "Archived", key: "archived" },
  { label: "Inventory", key: "inventory" },
  { label: "Low stock", key: "lowStock" },
  { label: "Out of stock", key: "outOfStock" },
];

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);

  useEffect(() => {
    setProducts(getCatalogProducts());
  }, []);

  const summary = useMemo(() => {
    const total = products.length;
    const published = products.filter((item) => item.status === "Published").length;
    const draft = products.filter((item) => item.status === "Draft").length;
    const archived = products.filter((item) => item.status === "Archived").length;
    const inventory = products.reduce((sum, item) => sum + Object.values(item.stock).reduce((value, count) => value + count, 0), 0);
    const lowStock = products.filter((item) => Object.values(item.stock).some((count) => count > 0 && count < 5)).length;
    const outOfStock = products.filter((item) => Object.values(item.stock).every((count) => count === 0)).length;

    return { total, published, draft, archived, inventory, lowStock, outOfStock };
  }, [products]);

  const recentOrders = [
    { id: "#USTR-1042", customer: "Nikhil P.", total: "₹2,499", status: "Processing" },
    { id: "#USTR-1041", customer: "Aisha R.", total: "₹1,899", status: "Confirmed" },
    { id: "#USTR-1039", customer: "Rahul B.", total: "₹1,299", status: "Shipped" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Overview</div>
        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Owner dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const value = summary[stat.key as keyof typeof summary];
          return (
            <div key={stat.key} className="rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#63452f]">{stat.label}</div>
              <div className="mt-4 text-3xl font-bold text-[#29221d]">{value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-stone-200 bg-white p-5">
          <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#63452f]">Recent orders</div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-2xl bg-[#f9f3ee] p-4">
                <div>
                  <div className="font-semibold text-[#29221d]">{order.id}</div>
                  <div className="text-sm text-[#63452f]">{order.customer}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#29221d]">{order.total}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#63452f]">{order.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-stone-200 bg-[#f2e9dd] p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#63452f]">Quick actions</div>
          <div className="mt-5 space-y-3">
            <a href="/admin/add-product" className="block rounded-2xl bg-[#29221d] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white text-center">Add product</a>
            <a href="/admin/products" className="block rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#29221d] text-center">Review catalog</a>
            <a href="/admin/orders" className="block rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#29221d] text-center">Process orders</a>
          </div>
        </div>
      </div>
    </div>
  );
}
