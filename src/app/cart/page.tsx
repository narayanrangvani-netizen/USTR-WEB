"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { CartSummary } from "@/components/cart/CartSummary";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";

function CartPageContent() {
  const { items, removeFromCart, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Cart</div>
        <h1 className="mt-4 text-4xl font-semibold uppercase tracking-tight text-[#29221d]">Your bag is empty</h1>
        <p className="mt-3 max-w-md text-base text-[#63452f]">Build your next drop with elevated staples and statement pieces.</p>
        <Link href="/men" className="mt-6 rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-4">
            <img src={item.image} alt={item.name} className="h-28 w-24 rounded-[20px] object-cover" />
            <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.2em] text-[#63452f]">{item.color}</div>
                <h3 className="mt-1 text-xl font-semibold text-[#29221d]">{item.name}</h3>
                <p className="text-sm text-[#63452f]">Size {item.size}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => item.quantity === 1 ? removeFromCart(item.id) : updateQuantity(item.id, item.quantity - 1)}
                  aria-label={item.quantity === 1 ? `Remove ${item.name}` : `Decrease quantity of ${item.name}`}
                  className="h-9 w-9 rounded-full border border-stone-300 text-lg text-[#29221d]"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-medium text-[#29221d]">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-9 w-9 rounded-full border border-stone-300 text-lg text-[#29221d]"
                >
                  +
                </button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-[#29221d]">₹{item.price * item.quantity}</span>
                <button onClick={() => removeFromCart(item.id)} className="text-sm uppercase tracking-[0.18em] text-[#63452f]">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <CartSummary />
    </div>
  );
}

export default function CartRoute() {
  return (
    <div className="bg-[#fffdfc] text-[#29221d]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Cart</div>
        <CartPageContent />
      </main>
      <Footer />
    </div>
  );
}
