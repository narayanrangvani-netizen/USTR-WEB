"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from "react";
import { fetchProducts, type Product, type ProductImage } from "@/lib/products";

function imageFor(product: Product, role: ProductImage["role"], color: string) {
  const images = product.imageDetails ?? [];
  const colorway = images.find((image) => image.role === "colorway" && image.color === color);
  if (colorway) return colorway.url;
  const selected = images.find((image) => image.role === role);
  if (selected) return selected.url;
  if (role === "side") return images.find((image) => image.role === "front")?.url ?? product.images[0];
  if (role === "front" || role === "back") return product.images[0];
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

export function Showroom() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState("");
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

  const rackProducts = useMemo(
    () => products
      .filter((product) => product.status === "Published" && product.showOnRack && product.images.length > 0)
      .sort((a, b) => a.rackOrder - b.rackOrder)
      .slice(0, 10),
    [products],
  );
  const activeProduct = selected ?? rackProducts[mobileIndex] ?? null;
  const color = selectedColor && selected?.colors.includes(selectedColor)
    ? selectedColor
    : selected?.colors[0] ?? "";
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
    setSelectedColor(product.colors[0] ?? "");
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
    setSelected(next);
    setSelectedColor(next.colors[0] ?? "");
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
    if (!rack || rackProducts.length === 0) return;
    const cards = Array.from(rack.querySelectorAll<HTMLElement>(".rack-item"));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setMobileIndex(Number((visible.target as HTMLElement).dataset.index));
    }, { root: rack, threshold: [0.35, 0.6, 0.85] });
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [rackProducts]);

  const selectedIndex = selected ? rackProducts.findIndex((product) => product.id === selected.id) : isMobile ? mobileIndex : hoveredIndex ?? 0;
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
        <span className="showroom-nav">ABOUT</span>
        <Link href="/" className="showroom-wordmark" aria-label="USTR SUITS home">USTR SUITS</Link>
        <span className="showroom-nav showroom-nav-right">CONTACT</span>
      </header>

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
            <p className="rack-state-note">No published, rack-visible products with photos are available yet.</p>
          </div>
        ) : (
          <div className="rack-items" ref={rackRef} aria-label="Browse products; scroll horizontally on mobile">
            {rackProducts.map((product, index) => {
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

        {!loading && !error && rackProducts.length > 0 && (
          <p className="rack-caption" aria-live="polite">
            {rackProducts[selectedIndex]?.name}
            {rackProducts[selectedIndex]?.colors[0] ? ` — ${rackProducts[selectedIndex].colors[0]}` : ""}
          </p>
        )}
      </section>

      <div className="availability-row">
        <Link
          href={activeProduct ? `/product/${activeProduct.slug}` : "/men"}
          className="availability-button"
        >
          SEE AVAILABILITY
        </Link>
        {rackProducts.length > 0 && rackProducts.length < 4 && (
          <p className="rack-state-note">{rackProducts.length} of 4 recommended rack slots are currently filled.</p>
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
                </div>
              </div>
              {activeProduct.colors.length > 0 && (
                <div className="focus-colors" aria-label="Available colours">
                  {activeProduct.colors.map((itemColor) => {
                    const hasImage = activeProduct.imageDetails?.some((image) => image.role === "colorway" && image.color === itemColor);
                    return (
                      <button
                        key={itemColor}
                        type="button"
                        className={`colour-label ${color === itemColor ? "colour-label-active" : ""}`}
                        aria-pressed={color === itemColor}
                        aria-label={`${itemColor}${hasImage ? "" : " colour photo not uploaded"}`}
                        onClick={() => {
                          setSelectedColor(itemColor);
                          setView("front");
                        }}
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
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
