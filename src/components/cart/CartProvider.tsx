"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getVariantStock, type Product } from "@/lib/products";

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
  availableStock?: number;
};

type CartContextType = {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  addToCart: (product: Product, selection: { size: string; color: string }, quantity?: number, openBagAfterAdd?: boolean) => boolean;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isBagOpen: boolean;
  bagNotice: string;
  openBag: () => void;
  closeBag: () => void;
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
      typeof item.slug === "string" &&
      typeof item.name === "string" &&
      typeof item.image === "string" &&
      typeof item.color === "string" &&
      typeof item.size === "string" &&
      typeof item.price === "number" &&
      Number.isFinite(item.price) &&
      Number.isInteger(item.quantity) &&
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
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [bagNotice, setBagNotice] = useState("");
  const openBag = useCallback(() => {
    setBagNotice("");
    setIsBagOpen(true);
  }, []);
  const closeBag = useCallback(() => setIsBagOpen(false), []);

  const addToCart = (
    product: Product,
    selection: { size: string; color: string },
    quantity = 1,
    openBagAfterAdd = true,
  ) => {
    const availableStock = getVariantStock(product, selection.color, selection.size);
    if (!Number.isInteger(quantity) || quantity < 1 || availableStock < quantity) return false;
    const cartId = `${product.id}-${selection.size}-${selection.color}`;
    let added = false;

    updateCart((current) => {
      const existing = current.find((item) => item.id === cartId);
      if (existing && existing.quantity + quantity > Math.min(10, availableStock)) return current;
      added = true;
      if (existing) return current.map((item) =>
        item.id === cartId
          ? { ...item, quantity: item.quantity + quantity, availableStock }
          : item,
      );

      return [
        ...current,
        {
          id: cartId,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.imageDetails?.find((image) => image.role === "colorway" && image.color === selection.color)?.url
            ?? product.images[0],
          price: product.price,
          size: selection.size,
          color: selection.color,
          quantity,
          availableStock,
        },
      ];
    });
    if (added) {
      setBagNotice(`${product.name} added to your bag.`);
      if (openBagAfterAdd) setIsBagOpen(true);
    }
    return added;
  };

  const removeFromCart = (id: string) => updateCart((current) => current.filter((item) => item.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    updateCart((current) =>
      current
        .map((item) => item.id === id
          ? { ...item, quantity: Math.min(item.availableStock ?? 10, 10, Math.max(1, quantity)) }
          : item)
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
    <CartContext.Provider value={{
      items,
      subtotal,
      shipping,
      total,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isBagOpen,
      bagNotice,
      openBag,
      closeBag,
    }}>
      {children}
      <BagDrawer />
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

function BagDrawer() {
  const { items, subtotal, shipping, total, isBagOpen, bagNotice, closeBag, removeFromCart, updateQuantity } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isBagOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeBag();
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>(".bag-drawer");
      const focusable = dialog?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeBag, isBagOpen]);

  if (!isBagOpen) return null;

  return (
    <div
      className="bag-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeBag();
      }}
    >
      <aside className="bag-drawer" role="dialog" aria-modal="true" aria-labelledby="bag-title">
        <div className="bag-drawer-header">
          <div>
            <p className="bag-eyebrow">USTR SUITS</p>
            <h2 id="bag-title">Your bag <span>({items.reduce((count, item) => count + item.quantity, 0)})</span></h2>
          </div>
          <button ref={closeRef} type="button" className="bag-close" onClick={closeBag} aria-label="Close shopping bag">×</button>
        </div>
        {bagNotice && <p className="bag-notice" role="status">{bagNotice}</p>}

        {items.length === 0 ? (
          <div className="bag-empty">
            <p>Your bag is waiting for its first piece.</p>
            <button type="button" onClick={closeBag}>CONTINUE SHOPPING</button>
          </div>
        ) : (
          <>
            <div className="bag-items">
              {items.map((item) => (
                <article className="bag-item" key={item.id}>
                  <div className="bag-item-image">
                    <Image src={item.image} alt={item.name} fill sizes="88px" unoptimized />
                  </div>
                  <div className="bag-item-copy">
                    <Link href={`/product/${item.slug}`} onClick={closeBag}>{item.name}</Link>
                    <p>{item.color} · Size {item.size}</p>
                    <strong>₹{item.price.toLocaleString("en-IN")}</strong>
                    <div className="bag-item-actions">
                      <div className="bag-quantity" aria-label={`Quantity for ${item.name}`}>
                        <button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          disabled={item.quantity >= Math.min(10, item.availableStock ?? 10)}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >+</button>
                      </div>
                      <button type="button" className="bag-remove" onClick={() => removeFromCart(item.id)}>Remove</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="bag-summary">
              <div><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
              <div><span>Shipping</span><span>{shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`}</span></div>
              <div className="bag-total"><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
              <Link href="/checkout" className="bag-checkout" onClick={closeBag}>CONTINUE TO CHECKOUT</Link>
              <Link href="/cart" className="bag-view" onClick={closeBag}>VIEW FULL BAG</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
