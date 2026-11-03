"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Overview", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Add Product", href: "/admin/add-product" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Inventory", href: "/admin/inventory" },
  { label: "Showroom", href: "/admin/showroom" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Coupons", href: "/admin/coupons" },
  { label: "Store Settings", href: "/admin/settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setLogoutError("");
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setLogoutError(body.error ?? "Could not sign out. Please try again.");
      return;
    }
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f8f3ee] text-[#29221d]">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="fixed bottom-0 left-0 z-40 flex w-full gap-2 overflow-x-auto border-t border-stone-200 bg-white p-2 lg:hidden">
          {navItems.map((item) => <Link key={item.href} href={item.href} className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium ${pathname === item.href ? "bg-[#29221d] text-white" : "text-[#63452f]"}`}>{item.label}</Link>)}
          <button onClick={handleLogout} className="shrink-0 rounded-full px-3 py-2 text-xs font-medium text-[#63452f]">Logout</button>
        </nav>
        <aside className="hidden w-72 shrink-0 rounded-[28px] border border-stone-200 bg-white p-5 lg:block">
          <div className="text-xl font-black uppercase tracking-[0.22em] text-[#29221d]">USTR SUITS</div>
          <div className="mt-8 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active ? "bg-[#29221d] text-white" : "text-[#63452f] hover:bg-[#f2e9dd]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <button
            onClick={handleLogout}
            className="mt-8 w-full rounded-full border border-stone-300 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#29221d] hover:bg-[#f2e9dd]"
          >
            Logout
          </button>
          {logoutError && <p role="alert" className="mt-3 text-xs text-red-700">{logoutError}</p>}
        </aside>

        <main className="mb-16 flex-1 rounded-[28px] border border-stone-200 bg-white p-4 sm:p-6 lg:mb-0">{children}</main>
      </div>
    </div>
  );
}
