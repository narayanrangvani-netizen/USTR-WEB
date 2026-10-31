import { DEFAULT_PRODUCTS } from "@/lib/products";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Inventory</div>
        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Variant stock</h1>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-stone-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f2e9dd] text-[#29221d]">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Size</th>
              <th className="p-4">Colour</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {DEFAULT_PRODUCTS.map((product) => (
              <tr key={product.id} className="border-t border-stone-200">
                <td className="p-4 font-medium text-[#29221d]">{product.name}</td>
                <td className="p-4 text-[#63452f]">{product.sizes[0]}</td>
                <td className="p-4 text-[#63452f]">{product.colors[0]}</td>
                <td className="p-4 text-[#29221d] font-semibold">{Object.values(product.stock).reduce((sum, value) => sum + value, 0)}</td>
                <td className="p-4"><span className="rounded-full bg-[#e4d4c2] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#29221d]">In stock</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
