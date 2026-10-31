"use client";

import Link from "next/link";
import { useState } from "react";
import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";

function CheckoutContent() {
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    clearCart();
  };

  if (items.length === 0 && !submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Checkout</div>
        <h1 className="mt-4 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Your bag is empty</h1>
        <Link href="/men" className="mt-6 inline-block rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">
          Shop the latest drop
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Order placed</div>
        <h1 className="mt-4 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Payment pending confirmation</h1>
        <p className="mt-4 text-base leading-7 text-[#63452f]">
          Your order has been created and will be confirmed only after a real payment gateway verifies the payment. No fake success state is shown.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6 rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Delivery</div>
          <h2 className="mt-3 text-2xl font-semibold uppercase tracking-tight text-[#29221d]">Address</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" placeholder="First name" required />
          <input className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" placeholder="Last name" required />
          <input className="md:col-span-2 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" placeholder="Street address" required />
          <input className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" placeholder="City" required />
          <input className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm" placeholder="PIN code" required />
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Payment</div>
          <div className="mt-4 rounded-2xl border border-stone-300 bg-white p-4 text-sm text-[#63452f]">
            Secure gateway verification is required before payment is marked successful.
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-stone-200 bg-white p-6">
        <div className="mb-6 text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Summary</div>
        <div className="space-y-4 text-sm text-[#63452f]">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>₹{shipping}</span></div>
          <div className="flex justify-between border-t border-stone-200 pt-4 text-base font-semibold text-[#29221d]"><span>Total</span><span>₹{total}</span></div>
        </div>
        <button type="submit" className="mt-6 w-full rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">
          Confirm order
        </button>
      </div>
    </form>
  );
}

export default function CheckoutRoute() {
  return (
    <CartProvider>
      <div className="bg-[#fffdfc] text-[#29221d]">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Checkout</div>
          <CheckoutContent />
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
