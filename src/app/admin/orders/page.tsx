const orders = [
  { id: "USTR-1042", customer: "Nikhil P.", total: "₹2,499", status: "Processing" },
  { id: "USTR-1041", customer: "Aisha R.", total: "₹1,899", status: "Confirmed" },
  { id: "USTR-1039", customer: "Rahul B.", total: "₹1,299", status: "Shipped" },
  { id: "USTR-1037", customer: "Kavya S.", total: "₹2,799", status: "Pending" },
];

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Orders</div>
        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Order management</h1>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="flex flex-col gap-4 rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-[#29221d]">{order.id}</div>
              <div className="text-sm text-[#63452f]">{order.customer}</div>
            </div>
            <div className="text-lg font-semibold text-[#29221d]">{order.total}</div>
            <div className="rounded-full bg-[#e4d4c2] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#29221d]">{order.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
