import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-[#f9f3ee]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <div className="text-2xl font-black uppercase tracking-[0.22em] text-[#29221d]">USTR SUITS</div>
          <p className="max-w-xs text-sm leading-6 text-[#63452f]">
            Premium streetwear built for confidence, comfort, and everyday expression.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#29221d]">Shop</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#63452f]">
            <li><Link href="/men">Men</Link></li>
            <li><Link href="/women">Women</Link></li>
            <li><Link href="/t-shirts">T-shirts</Link></li>
            <li><Link href="/shirts">Shirts</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#29221d]">Company</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#63452f]">
            <li><Link href="/about">Our Story</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/shipping">Shipping</Link></li>
            <li><Link href="/returns">Returns</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#29221d]">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#63452f]">
            <li>Ahmedabad, India</li>
            <li>Customer contact details are being set up.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-200 bg-white py-4 text-center text-xs uppercase tracking-[0.22em] text-[#63452f]">
        © 2026 USTR SUITS — wear your identity.
      </div>
    </footer>
  );
}
