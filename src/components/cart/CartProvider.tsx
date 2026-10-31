"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, selection: { size: string; color: string }) => {
    const cartId = `${product.id}-${selection.size}-${selection.color}`;

    setItems((current) => {
      const existing = current.find((item) => item.id === cartId);
      if (existing) {
        return current.map((item) =>
          item.id === cartId ? { ...item, quantity: item.quantity + 1 } : item,
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

  const removeFromCart = (id: string) => setItems((current) => current.filter((item) => item.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    setItems((current) =>
      current
        .map((item) => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const shipping = subtotal > 0 ? 199 : 0;
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
