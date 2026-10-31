"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";

type Address = {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
};

const emptyAddress: Address = {
  full_name: "",
  phone: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
};

function CheckoutContent() {
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const [address, setAddress] = useState(emptyAddress);
  const [signedIn, setSignedIn] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not check your account.");
        setSignedIn(Boolean(body.user));
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not check your account."))
      .finally(() => setCheckingAccount(false));
  }, []);

  function setField<K extends keyof Address>(field: K, value: Address[K]) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signedIn) {
      setError("Sign in to place your order.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not place your order.");
      setOrderId(body.orderId);
      clearCart();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not place your order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (orderId) {
    return (
      <div className="mx-auto max-w-2xl rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Order received</div>
        <h1 className="mt-4 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Thanks for shopping USTR</h1>
        <p className="mt-4 text-[#63452f]">Order reference: <span className="font-semibold text-[#29221d]">{orderId}</span></p>
        <p className="mt-3 text-sm leading-6 text-[#63452f]">Payment method: cash on delivery. Payment is still pending and will be collected by the carrier when your order arrives. This store does not currently process online payments.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">Continue shopping</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Checkout</div>
        <h1 className="mt-4 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Your bag is empty</h1>
        <Link href="/men" className="mt-6 inline-block rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">Shop the latest drop</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6 rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Delivery</div>
          <h2 className="mt-3 text-2xl font-semibold uppercase tracking-tight text-[#29221d]">Address in India</h2>
        </div>
        {!checkingAccount && !signedIn && (
          <div className="rounded-2xl border border-[#d6c3af] bg-white p-4 text-sm text-[#63452f]">
            Sign in is required to place an order. <Link href="/account" className="font-semibold underline">Sign in or create an account</Link>.
          </div>
        )}
        {checkingAccount && <p className="text-sm text-[#63452f]">Checking sign-in…</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2"><span className="mb-2 block text-sm font-medium text-[#63452f]">Recipient full name</span><input autoComplete="name" value={address.full_name} onChange={(event) => setField("full_name", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" minLength={2} required /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm font-medium text-[#63452f]">Mobile number</span><input type="tel" autoComplete="tel" inputMode="tel" value={address.phone} onChange={(event) => setField("phone", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" placeholder="+91 98765 43210" minLength={8} required /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm font-medium text-[#63452f]">House, street, area</span><input autoComplete="address-line1" value={address.address_line_1} onChange={(event) => setField("address_line_1", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" minLength={4} required /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm font-medium text-[#63452f]">Landmark or apartment (optional)</span><input autoComplete="address-line2" value={address.address_line_2} onChange={(event) => setField("address_line_2", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">City</span><input autoComplete="address-level2" value={address.city} onChange={(event) => setField("city", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">State</span><input autoComplete="address-level1" value={address.state} onChange={(event) => setField("state", event.target.value)} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" required /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-[#63452f]">PIN code</span><input inputMode="numeric" autoComplete="postal-code" value={address.postal_code} onChange={(event) => setField("postal_code", event.target.value.replace(/\D/g, "").slice(0, 6))} className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" pattern="[0-9]{6}" minLength={6} maxLength={6} required /></label>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Payment</div>
          <div className="mt-4 rounded-2xl border border-stone-300 bg-white p-4 text-sm text-[#63452f]">
            Cash on delivery is the only payment option right now. Online payment will become available after a payment provider is integrated and verified.
          </div>
        </div>
      </div>

      <div className="h-fit rounded-[28px] border border-stone-200 bg-white p-6">
        <div className="mb-6 text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Summary</div>
        <div className="space-y-4 text-sm text-[#63452f]">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
          <div className="flex justify-between border-t border-stone-200 pt-4 text-base font-semibold text-[#29221d]"><span>Total</span><span>₹{total}</span></div>
        </div>
        {error && <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button type="submit" disabled={submitting || checkingAccount || !signedIn} className="mt-6 w-full rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50">{submitting ? "Placing order…" : "Place COD order"}</button>
      </div>
    </form>
  );
}

export default function CheckoutRoute() {
  return (
    <div className="bg-[#fffdfc] text-[#29221d]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Checkout</div>
        <CheckoutContent />
      </main>
      <Footer />
    </div>
  );
}
