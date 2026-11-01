import Link from "next/link";
import { CartLink } from "@/components/cart/CartLink";

const navItems = [
  { label: "Men", href: "/men" },
  { label: "Women", href: "/women" },
  { label: "New Arrivals", href: "/#new-arrivals" },
  { label: "Collections", href: "/#collections" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#fdfaf5]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-black uppercase tracking-[0.22em] text-[#29221d]">
            USTR SUITS
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#63452f] md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-[#29221d]">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-[#63452f]">
          <button aria-label="Search" className="rounded-full border border-stone-300 p-2 transition hover:border-[#63452f]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
              <circle cx="11" cy="11" r="6" />
              <path d="M16 16L21 21" />
            </svg>
          </button>
          <Link href="/account" aria-label="Account" className="rounded-full border border-stone-300 p-2 transition hover:border-[#63452f]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20c1.5-3 4.2-4.5 7-4.5s5.5 1.5 7 4.5" />
            </svg>
          </Link>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
