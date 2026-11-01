"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { calculateDiscount, fetchProducts, getVariantStock, type Product, type ProductImage } from "@/lib/products";
import { CartLink } from "@/components/cart/CartLink";

export type RackFilter = "all" | "men" | "women" | "new" | "bestsellers" | "t-shirts" | "shirts";

const filters: { id: RackFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
  { id: "new", label: "New drops" },
  { id: "bestsellers", label: "Bestsellers" },
  { id: "t-shirts", label: "T-shirts" },
  { id: "shirts", label: "Shirts" },
];

function firstAvailableSize(product: Product, color: string) {
  return product.sizes.find((size) => getVariantStock(product, color, size) > 0) ?? "";
}

function imageFor(product: Product, role: ProductImage["role"], color: string) {
  const images = product.imageDetails ?? [];
  if (role === "back") return images.find((image) => image.role === "back")?.url ?? product.images[0];
  if (role === "side") {
    return images.find((image) => image.role === "side")?.url
      ?? images.find((image) => image.role === "colorway" && image.color === color)?.url
      ?? images.find((image) => image.role === "front")?.url
      ?? product.images[0];
  }
  if (role === "front") {
    return images.find((image) => image.role === "colorway" && image.color === color)?.url
      ?? images.find((image) => image.role === "front")?.url
      ?? product.images[0];
  }
  return product.images[0];
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", notify);
      return () => mediaQuery.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function RackGarment({
  product,
  index,
  selected,
  neighbor,
  reducedMotion,
  onOpen,
  onHover,
}: {
  product: Product;
  index: number;
  selected: boolean;
  neighbor: number;
  reducedMotion: boolean;
  onOpen: (product: Product, button: HTMLButtonElement) => void;
  onHover: (index: number | null) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const angle = useRef(76);
  const angularVelocity = useRef(0);
  const swing = useRef(0);
  const swingVelocity = useRef(0);
  const lastPointerX = useRef<number | null>(null);
  const [front, setFront] = useState(false);
  const activeColor = product.colors[0] ?? "";
  const sideImage = imageFor(product, "side", activeColor);
  const frontImage = imageFor(product, "front", activeColor);
  const isFrontVisible = reducedMotion ? selected : front;

  useEffect(() => {
    let frame = 0;
    let previous = 0;
    const target = selected ? 0 : 76;
    const paint = (nextAngle: number, nextSwing: number) => {
      if (!buttonRef.current) return;
      buttonRef.current.style.transform =
        `perspective(900px) rotateY(${nextAngle}deg) rotateZ(${nextSwing}deg) scale(${selected ? 1.12 : 1})`;
    };

    if (reducedMotion) {
      angle.current = target;
      angularVelocity.current = 0;
      swing.current = 0;
      swingVelocity.current = 0;
      paint(target, 0);
      return;
    }

    const tick = (timestamp: number) => {
      const dt = previous === 0 ? 0 : Math.min((timestamp - previous) / 1000, 0.032);
      previous = timestamp;
      const currentTarget = selected ? 0 : 76;
      angularVelocity.current += ((currentTarget - angle.current) * 120 - angularVelocity.current * 14) * dt;
      angle.current += angularVelocity.current * dt;
      swingVelocity.current += (-swing.current * 90 - swingVelocity.current * 5 + angularVelocity.current * 0.02) * dt;
      swing.current += swingVelocity.current * dt;

      const showingFront = selected && angle.current < 38;
      setFront((current) => current === showingFront ? current : showingFront);
      paint(angle.current, swing.current);

      const settled = Math.abs(currentTarget - angle.current) < 0.05 &&
        Math.abs(swing.current) < 0.03 &&
        Math.abs(swingVelocity.current) < 0.03;
      if (!settled) frame = requestAnimationFrame(tick);
      else {
        angle.current = currentTarget;
        swing.current = 0;
        angularVelocity.current = 0;
        swingVelocity.current = 0;
        paint(currentTarget, 0);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [selected, reducedMotion]);

  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const delta = lastPointerX.current === null ? 0 : event.clientX - lastPointerX.current;
    lastPointerX.current = event.clientX;
    swingVelocity.current = Math.max(-24, Math.min(24, swingVelocity.current + delta * 0.35));
  };

  return (
    <div
      className={`rack-item ${selected ? "rack-item-active" : ""} ${neighbor ? "rack-item-neighbor" : ""}`}
      style={{ "--neighbor-shift": `${neighbor * 38}px` } as CSSProperties}
      data-index={index}
    >
      <button
        ref={buttonRef}
        type="button"
        className="rack-garment"
        aria-label={`View ${product.name}`}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") {
            angularVelocity.current -= 26;
            swingVelocity.current += (Math.sign(event.nativeEvent.movementX) || 1) * 26;
            lastPointerX.current = event.clientX;
            onHover(index);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") {
            angularVelocity.current += 16;
            swingVelocity.current -= (Math.sign(event.nativeEvent.movementX) || 1) * 16;
            lastPointerX.current = null;
            onHover(null);
          }
        }}
        onPointerMove={pointerMove}
        onFocus={() => onHover(index)}
        onBlur={() => onHover(null)}
        onClick={() => buttonRef.current && onOpen(product, buttonRef.current)}
      >
        <span className="rack-hook" aria-hidden="true" />
        <span className="rack-hanger" aria-hidden="true" />
        {(product.newArrival || product.bestseller) && (
          <span className="rack-badge">{product.newArrival ? "NEW" : "BESTSELLER"}</span>
        )}
        {(isFrontVisible ? frontImage : sideImage) ? (
          <Image
            src={(isFrontVisible ? frontImage : sideImage) ?? product.images[0]}
            alt=""
            fill
            sizes="(max-width: 640px) 36vw, 14vw"
            className="rack-garment-image"
            unoptimized
            priority={index < 5}
          />
        ) : <span className="rack-image-empty">Photo needed</span>}
      </button>
    </div>
  );
}

export function Showroom({ initialFilter = "all" }: { initialFilter?: RackFilter }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [purchaseError, setPurchaseError] = useState("");
  const [filter, setFilter] = useState<RackFilter>(initialFilter);
  const [rackPage, setRackPage] = useState(0);
  const [view, setView] = useState<"front" | "back">("front");
  const [mobileIndex, setMobileIndex] = useState(0);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [closing, setClosing] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number; scale: number } | null>(null);
  const rackRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load the showroom."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const rackProducts = useMemo(() => products
    .filter((product) => {
      if (product.status !== "Published" || !product.showOnRack || product.images.length === 0) return false;
      const normalizedCategory = product.category.toLowerCase().replace(/[^a-z]/g, "");
      switch (filter) {
        case "men": return product.gender === "Men" || product.gender === "Unisex";
        case "women": return product.gender === "Women" || product.gender === "Unisex";
        case "new": return product.newArrival;
        case "bestsellers": return product.bestseller;
        case "t-shirts": return normalizedCategory.includes("tshirt");
        case "shirts": return normalizedCategory.includes("shirt") && !normalizedCategory.includes("tshirt");
        default: return true;
      }
    })
    .sort((a, b) => a.rackOrder - b.rackOrder), [filter, products]);
  const pageCount = Math.max(1, Math.ceil(rackProducts.length / 10));
  const visibleProducts = rackProducts.slice(rackPage * 10, rackPage * 10 + 10);
  const activeProduct = selected ?? visibleProducts[mobileIndex] ?? null;
  const color = activeProduct
    ? selectedColor && activeProduct.colors.includes(selectedColor)
      ? selectedColor
      : activeProduct.colors[0] ?? ""
    : "";
  const availableSizes = activeProduct
    ? activeProduct.sizes.filter((size) => getVariantStock(activeProduct, color, size) > 0)
    : [];
  const size = activeProduct && availableSizes.includes(selectedSize)
    ? selectedSize
    : availableSizes[0] ?? "";
  const availableStock = activeProduct && size ? getVariantStock(activeProduct, color, size) : 0;
  const activeImage = activeProduct ? imageFor(activeProduct, view, color) : null;
  const canShowBack = Boolean(activeProduct && activeProduct.imageDetails?.some((image) => image.role === "back"));
  const hasColorImages = Boolean(activeProduct?.imageDetails?.some((image) => image.role === "colorway"));

  const openProduct = useCallback((product: Product, button: HTMLButtonElement) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const rect = button.getBoundingClientRect();
    setOrigin({
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
      scale: Math.max(0.1, rect.width / Math.min(window.innerWidth * 0.55, window.innerHeight * 0.62)),
    });
    returnFocus.current = button;
    setSelected(product);
    const initialColor = product.colors[0] ?? "";
    setSelectedColor(initialColor);
    setSelectedSize(firstAvailableSize(product, initialColor));
    setQuantity(1);
    setPurchaseError("");
    setView("front");
    setClosing(false);
  }, []);

  const closeProduct = useCallback(() => {
    if (!selected || closing) return;
    if (reducedMotion) {
      setSelected(null);
      returnFocus.current?.focus();
      return;
    }
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setSelected(null);
      setClosing(false);
      returnFocus.current?.focus();
    }, 360);
  }, [closing, reducedMotion, selected]);

  const moveProduct = useCallback((direction: number) => {
    if (!selected || rackProducts.length < 2) return;
    const currentIndex = rackProducts.findIndex((product) => product.id === selected.id);
    const next = rackProducts[(currentIndex + direction + rackProducts.length) % rackProducts.length];
    const nextIndex = (currentIndex + direction + rackProducts.length) % rackProducts.length;
    const nextColor = next.colors[0] ?? "";
    setRackPage(Math.floor(nextIndex / 10));
    setMobileIndex(nextIndex % 10);
    setSelected(next);
    setSelectedColor(nextColor);
    setSelectedSize(firstAvailableSize(next, nextColor));
    setQuantity(1);
    setPurchaseError("");
    setView("front");
    setOrigin(null);
  }, [rackProducts, selected]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeProduct();
      if (event.key === "ArrowRight") moveProduct(1);
      if (event.key === "ArrowLeft") moveProduct(-1);
      if (event.key === "Tab") {
        const dialog = document.querySelector<HTMLElement>(".product-dialog");
        const focusable = dialog?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], summary");
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
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeProduct, moveProduct, selected]);

  useEffect(() => {
    if (selected) closeButtonRef.current?.focus();
  }, [selected]);

  useEffect(() => {
    const rack = rackRef.current;
    if (!rack || rack.childElementCount === 0) return;
    const cards = Array.from(rack.querySelectorAll<HTMLElement>(".rack-item"));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setMobileIndex(Number((visible.target as HTMLElement).dataset.index));
    }, { root: rack, threshold: [0.35, 0.6, 0.85] });
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [rackPage, rackProducts]);

  useEffect(() => {
    rackRef.current?.scrollTo({ left: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [filter, rackPage, reducedMotion]);

  const selectedIndex = selected ? visibleProducts.findIndex((product) => product.id === selected.id) : isMobile ? mobileIndex : hoveredIndex ?? 0;
  const chooseFilter = (nextFilter: RackFilter) => {
    setFilter(nextFilter);
    setRackPage(0);
    setMobileIndex(0);
    setHoveredIndex(null);
    setSelected(null);
    setPurchaseError("");
  };
  const changeRackPage = (nextPage: number) => {
    setRackPage(Math.max(0, Math.min(pageCount - 1, nextPage)));
    setMobileIndex(0);
    setHoveredIndex(null);
  };
  const changeColor = (nextColor: string) => {
    setSelectedColor(nextColor);
    if (activeProduct && getVariantStock(activeProduct, nextColor, selectedSize) < 1) {
      setSelectedSize(firstAvailableSize(activeProduct, nextColor));
    }
    setQuantity(1);
    setPurchaseError("");
    setView("front");
  };
  const purchase = (buyNow: boolean) => {
    if (!activeProduct || !size || !color || availableStock < quantity) {
      setPurchaseError("Choose an available colour and size before adding this item.");
      return;
    }
    const added = addToCart(activeProduct, { size, color }, quantity, !buyNow);
    if (!added) {
      setPurchaseError("This size is no longer available in that quantity. Please choose another size or quantity.");
      return;
    }
    setPurchaseError("");
    if (buyNow) {
      setSelected(null);
      router.push("/checkout");
    }
  };
  const supportStyle = origin
    ? ({
      "--fly-x": `${origin.x}px`,
      "--fly-y": `${origin.y}px`,
      "--fly-scale": origin.scale,
    } as CSSProperties)
    : undefined;

  return (
    <main className="showroom">
      <header className="showroom-header">
        <Link href="/about" className="showroom-nav">ABOUT</Link>
        <Link href="/" className="showroom-wordmark" aria-label="USTR SUITS home">USTR SUITS</Link>
        <Link href="/contact" className="showroom-nav showroom-nav-right">CONTACT</Link>
      </header>

      <div className="rack-toolbar">
        <nav className="rack-filters" aria-label="Shop collections">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              className={filter === item.id ? "rack-filter rack-filter-active" : "rack-filter"}
              onClick={() => chooseFilter(item.id)}
            >{item.label}</button>
          ))}
        </nav>
        <div className="rack-utilities">
          <Link href="/account" aria-label="Your account">ACCOUNT</Link>
          <CartLink />
        </div>
      </div>

      <section className="rack-stage" aria-label="USTR SUITS clothing rack">
        <div className="rack-copy">
          <span>WEAR YOUR IDENTITY.</span>
          <span>AHMEDABAD · INDIA</span>
        </div>
        <div className="rack-rail" aria-hidden="true"><i /><i /></div>

        {loading ? (
          <p className="rack-state" role="status">Preparing the rack…</p>
        ) : error ? (
          <div className="rack-state" role="status">
            <p>The showroom is being prepared.</p>
            <p className="rack-state-note">The collection is temporarily unavailable. Please check back soon.</p>
          </div>
        ) : rackProducts.length === 0 ? (
          <div className="rack-state">
            <p>The showroom is being prepared.</p>
            <p className="rack-state-note">No published products with photos are available for this collection yet.</p>
          </div>
        ) : (
          <div className="rack-items" ref={rackRef} aria-label="Browse products; scroll horizontally on mobile">
            {visibleProducts.map((product, index) => {
              const neighbor = hoveredIndex === null || hoveredIndex === index
                ? 0
                : index < hoveredIndex ? -1 : 1;
              return (
                <RackGarment
                  key={product.id}
                  product={product}
                  index={index}
                  selected={hoveredIndex === index || (isMobile && mobileIndex === index)}
                  neighbor={isMobile ? 0 : neighbor}
                  reducedMotion={reducedMotion}
                  onOpen={openProduct}
                  onHover={(next) => setHoveredIndex(next)}
                />
              );
            })}
          </div>
        )}

        {!loading && !error && visibleProducts.length > 0 && (
          <p className="rack-caption" aria-live="polite">
            {visibleProducts[selectedIndex]?.name}
            {visibleProducts[selectedIndex]?.colors[0] ? ` — ${visibleProducts[selectedIndex].colors[0]}` : ""}
            {visibleProducts[selectedIndex] && ` · ₹${visibleProducts[selectedIndex].price.toLocaleString("en-IN")}`}
            {visibleProducts[selectedIndex] && calculateDiscount(visibleProducts[selectedIndex]) > 0
              ? ` · ${calculateDiscount(visibleProducts[selectedIndex])}% OFF`
              : ""}
          </p>
        )}
      </section>

      {rackProducts.length > 10 && (
        <nav className="rack-pagination" aria-label="More clothing rack items">
          <button type="button" disabled={rackPage === 0} onClick={() => changeRackPage(rackPage - 1)}>← PREVIOUS</button>
          <span>{rackPage + 1} / {pageCount}</span>
          <button type="button" disabled={rackPage >= pageCount - 1} onClick={() => changeRackPage(rackPage + 1)}>NEXT →</button>
        </nav>
      )}

      <div className="availability-row">
        {activeProduct && <Link href={`/product/${activeProduct.slug}`} className="availability-button">SEE AVAILABILITY</Link>}
        {rackProducts.length > 0 && rackProducts.length < 4 && (
          <p className="rack-state-note">{rackProducts.length} published item{rackProducts.length === 1 ? "" : "s"} in this collection.</p>
        )}
      </div>

      <div className="showroom-marquee" aria-label="Wear your identity, new drops, Ahmedabad">
        <div className="marquee-track" aria-hidden="true">
          <span>WEAR YOUR IDENTITY <b>•</b> NEW DROPS <b>•</b> AHMEDABAD <b>•</b>&nbsp;</span>
          <span>WEAR YOUR IDENTITY <b>•</b> NEW DROPS <b>•</b> AHMEDABAD <b>•</b>&nbsp;</span>
        </div>
      </div>

      {selected && activeProduct && (
        <div className={`product-focus ${closing ? "product-focus-closing" : ""}`} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeProduct();
        }}>
          <section className="product-dialog" role="dialog" aria-modal="true" aria-label={`${activeProduct.name} product details`}>
            <button ref={closeButtonRef} type="button" className="focus-close" onClick={closeProduct}>CLOSE <span aria-hidden="true">×</span></button>
            <button type="button" className="focus-arrow focus-arrow-left" aria-label="Previous product" onClick={() => moveProduct(-1)}>‹</button>
            <div className="focus-garment-wrap">
              <span className="focus-hook" aria-hidden="true" />
              {activeImage ? (
                <Image
                  key={`${activeProduct.id}-${view}-${color}`}
                  src={activeImage}
                  alt={`${activeProduct.name}, ${view} view${color ? `, ${color}` : ""}`}
                  fill
                  sizes="(max-width: 640px) 60vw, 42vw"
                  className="focus-garment-image"
                  unoptimized
                  priority
                  style={supportStyle}
                />
              ) : <div className="focus-missing-image">This view has not been uploaded.</div>}
            </div>
            <button type="button" className="focus-arrow focus-arrow-right" aria-label="Next product" onClick={() => moveProduct(1)}>›</button>
            <div className="focus-details">
              <div className="focus-name-row">
                <h1>{activeProduct.name}</h1>
                <div className="focus-price">
                  <span>₹{activeProduct.price.toLocaleString("en-IN")}</span>
                  {activeProduct.mrp > activeProduct.price && <del>₹{activeProduct.mrp.toLocaleString("en-IN")}</del>}
                  {calculateDiscount(activeProduct) > 0 && <span className="focus-discount">{calculateDiscount(activeProduct)}% OFF</span>}
                </div>
              </div>
              <p className="focus-inventory" aria-live="polite">
                {!color ? "Choose a colour" : availableStock > 0 ? `${availableStock} available in size ${size}` : "Currently unavailable in this size"}
              </p>
              {activeProduct.colors.length > 0 && (
                <div className="focus-colors" aria-label="Available colours">
                  {activeProduct.colors.map((itemColor) => {
                    const hasImage = activeProduct.imageDetails?.some((image) => image.role === "colorway" && image.color === itemColor);
                    const hasStock = activeProduct.sizes.some((itemSize) => getVariantStock(activeProduct, itemColor, itemSize) > 0);
                    return (
                      <button
                        key={itemColor}
                        type="button"
                        className={`colour-label ${color === itemColor ? "colour-label-active" : ""}`}
                        aria-pressed={color === itemColor}
                        aria-label={`${itemColor}${hasImage ? "" : " colour photo not uploaded"}${hasStock ? "" : ", out of stock"}`}
                        disabled={!hasStock}
                        onClick={() => changeColor(itemColor)}
                      >
                        {itemColor}
                      </button>
                    );
                  })}
                  {!hasColorImages && activeProduct.colors.length > 1 && <span className="focus-colour-note">Colour photos not uploaded</span>}
                </div>
              )}
              <div className="focus-controls">
                <div className="front-back" role="group" aria-label="Product image view">
                  <button type="button" aria-pressed={view === "front"} onClick={() => setView("front")}>FRONT</button>
                  <button type="button" disabled={!canShowBack} aria-pressed={view === "back"} onClick={() => setView("back")}>BACK</button>
                  <span className={`front-back-indicator ${view === "back" ? "front-back-indicator-back" : ""}`} aria-hidden="true" />
                </div>
                <Link href={`/product/${activeProduct.slug}`} className="focus-availability">SEE AVAILABILITY ↗</Link>
              </div>
              <div className="focus-size-picker">
                <div className="focus-size-heading">
                  <span>SIZE</span>
                  <details className="focus-size-guide">
                    <summary>SIZE GUIDE</summary>
                    <p>{activeProduct.fit ? `Fit: ${activeProduct.fit}. ` : ""}Detailed garment measurements are not listed for this item. <Link href="/contact">Contact us</Link> for sizing help.</p>
                  </details>
                </div>
                <div className="focus-sizes" role="group" aria-label="Choose a size">
                  {activeProduct.sizes.map((itemSize) => {
                    const stock = getVariantStock(activeProduct, color, itemSize);
                    return (
                      <button
                        key={itemSize}
                        type="button"
                        disabled={stock < 1}
                        aria-pressed={size === itemSize}
                        aria-label={`Size ${itemSize}${stock > 0 ? `, ${stock} available` : ", out of stock"}`}
                        onClick={() => { setSelectedSize(itemSize); setQuantity(1); setPurchaseError(""); }}
                      >{itemSize}</button>
                    );
                  })}
                </div>
                {availableSizes.length === 0 && <p className="focus-stock-empty">This colour is currently out of stock.</p>}
              </div>
              <div className="focus-buy-row">
                <div className="focus-quantity" aria-label="Quantity">
                  <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
                  <span aria-live="polite">{quantity}</span>
                  <button type="button" aria-label="Increase quantity" disabled={quantity >= Math.min(10, availableStock)} onClick={() => setQuantity((value) => Math.min(10, availableStock, value + 1))}>+</button>
                </div>
                <button type="button" className="focus-add-button" disabled={!size || availableStock < 1} onClick={() => purchase(false)}>ADD TO BAG</button>
                <button type="button" className="focus-buy-button" disabled={!size || availableStock < 1} onClick={() => purchase(true)}>BUY NOW</button>
              </div>
              {purchaseError && <p className="focus-purchase-error" role="alert">{purchaseError}</p>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
