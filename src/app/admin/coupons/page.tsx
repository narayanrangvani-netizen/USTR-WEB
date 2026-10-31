const coupons = [
  { code: "WELCOME10", type: "Percentage", value: "10% off", minOrder: "₹999" },
  { code: "BROWN15", type: "Percentage", value: "15% off", minOrder: "₹1,999" },
  { code: "FREESHIP", type: "Fixed", value: "₹199", minOrder: "₹2,499" },
];

export default function CouponsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Coupons</div>
        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Discount management</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {coupons.map((coupon) => (
          <div key={coupon.code} className="rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#63452f]">{coupon.type}</div>
            <div className="mt-3 text-2xl font-semibold text-[#29221d]">{coupon.code}</div>
            <div className="mt-2 text-lg font-medium text-[#29221d]">{coupon.value}</div>
            <div className="mt-2 text-sm text-[#63452f]">Min order: {coupon.minOrder}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
