const categoryList = [
  { name: "Oversized T-shirts", count: 12 },
  { name: "Casual shirts", count: 8 },
  { name: "Polo T-shirts", count: 6 },
  { name: "Relaxed-fit shirts", count: 5 },
  { name: "Printed tops", count: 7 },
];

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#63452f]">Categories</div>
        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-tight text-[#29221d]">Manage collections</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categoryList.map((category) => (
          <div key={category.name} className="rounded-[24px] border border-stone-200 bg-[#f9f3ee] p-5">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-[#63452f]">Category</div>
            <div className="mt-3 text-2xl font-semibold text-[#29221d]">{category.name}</div>
            <div className="mt-2 text-sm text-[#63452f]">{category.count} products</div>
          </div>
        ))}
      </div>
    </div>
  );
}
