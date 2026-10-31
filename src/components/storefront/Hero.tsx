import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#f2e9dd]">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(173,139,104,0.18),_transparent_55%)] lg:block" />
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-8">
          <span className="inline-flex rounded-full border border-[#63452f] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">
            Premium Streetwear • India
          </span>
          <div className="space-y-6">
            <h1 className="max-w-xl font-['Oswald'] text-5xl uppercase leading-[0.9] tracking-tight text-[#29221d] sm:text-6xl">
              Wear Your Identity.
            </h1>
            <p className="max-w-lg text-lg text-[#63452f]">
              Discover everyday streetwear designed for expression, individuality and comfort.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/men" className="rounded-full bg-[#29221d] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#63452f]">
              Shop Men
            </Link>
            <Link href="/women" className="rounded-full border border-[#63452f] bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#63452f] transition hover:border-[#29221d] hover:text-[#29221d]">
              Shop Women
            </Link>
          </div>
          <div className="flex gap-8 pt-4 text-sm text-[#63452f]">
            <div>
              <div className="text-2xl font-bold text-[#29221d]">1500+</div>
              <div>Fresh drops</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#29221d]">4.9/5</div>
              <div>Style rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#29221d]">48h</div>
              <div>Dispatch</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative mx-auto max-w-lg overflow-hidden rounded-[32px] border border-stone-200 bg-[#f8f3ee] p-4 shadow-2xl shadow-stone-200/60">
            <img
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1100&q=80"
              alt="USTR SUITS streetwear collection"
              className="h-[620px] w-full rounded-[24px] object-cover"
            />
            <div className="absolute bottom-8 left-8 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur">
              <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#63452f]">New drop</div>
              <div className="mt-2 text-lg font-semibold text-[#29221d]">Essentials / 2026</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
