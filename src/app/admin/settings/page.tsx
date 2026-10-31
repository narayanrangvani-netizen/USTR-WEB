export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Store settings</div>
        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Brand configuration</h1>
      </div>

      <div className="grid gap-5 rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-6 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#63452f]">Brand email</span>
          <input defaultValue="hello@ustrsuits.com" className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#63452f]">Support phone</span>
          <input defaultValue="+91 98765 43210" className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-[#63452f]">Instagram URL</span>
          <input defaultValue="https://instagram.com/ustrsuits" className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-[#63452f]">Store announcement</span>
          <textarea defaultValue="Free shipping over ₹2,499 and new drops every Friday." className="min-h-28 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3" />
        </label>
      </div>
    </div>
  );
}
