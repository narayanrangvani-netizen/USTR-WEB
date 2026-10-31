"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export function CartSummary() {
  const { subtotal, shipping, total, items } = useCart();

  return (
    <aside className="rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-6">
      <h3 className="text-lg font-semibold uppercase tracking-[0.18em] text-[#29221d]">Order Summary</h3>
      <div className="mt-6 space-y-4 text-sm text-[#63452f]">
        <div className="flex justify-between">
          <span>Items</span>
          <span>{items.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-stone-200 pt-4 text-base font-semibold text-[#29221d]">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>
      <Link href="/checkout" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#29221d] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#63452f]">
        Proceed to checkout
      </Link>
    </aside>
  );
}
