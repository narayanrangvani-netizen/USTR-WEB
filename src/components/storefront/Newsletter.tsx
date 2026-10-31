export function Newsletter() {
  return (
    <section className="bg-[#29221d] py-20 text-white">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#e4d4c2]">Stay in the loop</p>
        <h2 className="mt-5 text-3xl font-semibold uppercase tracking-tight sm:text-5xl">Join the USTR SUITS list</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-[#f2e9dd]">
          Be first to hear about new collections, limited drops, and exclusive early access.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <input
            type="email"
            placeholder="Email address"
            className="w-full max-w-md rounded-full border border-white/15 bg-white/5 px-5 py-3 text-white placeholder:text-stone-300 focus:border-[#e4d4c2] focus:outline-none sm:w-auto"
          />
          <button className="rounded-full bg-[#f2e9dd] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#29221d] transition hover:bg-white">
            Subscribe
          </button>
        </div>
      </div>
    </section>
  );
}
