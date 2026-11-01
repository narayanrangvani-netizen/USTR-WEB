export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Store settings</div>
        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Brand configuration</h1>
      </div>

      <div className="rounded-[28px] border border-stone-200 bg-[#f9f3ee] p-6 text-sm leading-6 text-[#63452f]">
        Store settings are not persisted yet. The previous example contact details and announcement were placeholders, so they have been removed rather than presented as real store information.
      </div>
    </div>
  );
}
