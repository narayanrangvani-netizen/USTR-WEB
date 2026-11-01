import Link from "next/link";
import { Footer } from "@/components/storefront/Footer";
import { Header } from "@/components/storefront/Header";

export function InfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fffdfc] text-[#29221d]">
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-16 sm:px-6">
        <Link href="/" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#63452f]">← USTR SUITS</Link>
        <h1 className="mt-8 text-4xl font-semibold uppercase tracking-tight">{title}</h1>
        <div className="mt-6 space-y-5 text-base leading-7 text-[#63452f]">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
