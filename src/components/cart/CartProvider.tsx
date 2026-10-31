"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { Product } from "@/lib/products";

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  addToCart: (product: Product, selection: { size: string; color: string }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "ustr-cart";
const EMPTY_ITEMS: CartItem[] = [];
let cartSnapshot: CartItem[] | undefined;
const cartListeners = new Set<() => void>();
const CartContext = createContext<CartContextType | undefined>(undefined);

function getCartSnapshot() {
  if (typeof window === "undefined") return EMPTY_ITEMS;
  if (cartSnapshot) return cartSnapshot;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    cartSnapshot = Array.isArray(parsed) ? parsed.filter((item): item is CartItem =>
      item &&
      typeof item.id === "string" &&
      typeof item.productId === "string" &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      typeof item.quantity === "number" &&
      item.quantity > 0,
    ) : EMPTY_ITEMS;
  } catch {
    cartSnapshot = EMPTY_ITEMS;
  }
  return cartSnapshot;
}

function subscribeToCart(listener: () => void) {
  cartListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    cartSnapshot = undefined;
    cartListeners.forEach((notify) => notify());
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    cartListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function updateCart(update: (current: CartItem[]) => CartItem[]) {
  const next = update(getCartSnapshot());
  cartSnapshot = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cartListeners.forEach((listener) => listener());
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeToCart, getCartSnapshot, () => EMPTY_ITEMS);

  const addToCart = (product: Product, selection: { size: string; color: string }) => {
    const cartId = `${product.id}-${selection.size}-${selection.color}`;

    updateCart((current) => {
      const existing = current.find((item) => item.id === cartId);
      if (existing) {
        return current.map((item) =>
          item.id === cartId ? { ...item, quantity: Math.min(10, item.quantity + 1) } : item,
        );
      }

      return [
        ...current,
        {
          id: cartId,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          price: product.price,
          size: selection.size,
          color: selection.color,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => updateCart((current) => current.filter((item) => item.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    updateCart((current) =>
      current
        .map((item) => item.id === id ? { ...item, quantity: Math.min(10, Math.max(1, quantity)) } : item)
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => updateCart(() => EMPTY_ITEMS);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const shipping = subtotal >= 2499 ? 0 : subtotal > 0 ? 199 : 0;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider value={{ items, subtotal, shipping, total, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
