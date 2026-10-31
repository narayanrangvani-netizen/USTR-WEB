"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export function CartLink() {
  const { items } = useCart();
  const count = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link href="/cart" aria-label={`Cart${count ? `, ${count} items` : ""}`} className="relative rounded-full border border-stone-300 p-2 transition hover:border-[#63452f]">
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="17" cy="18" r="1.5" />
        <path d="M3 4h2l2.4 9.2A2 2 0 0 0 9.3 15h8.2a2 2 0 0 0 1.9-1.5L21 7H7" />
      </svg>
      {count > 0 && <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#29221d] px-1 text-[10px] font-bold text-white">{count}</span>}
    </Link>
  );
}
