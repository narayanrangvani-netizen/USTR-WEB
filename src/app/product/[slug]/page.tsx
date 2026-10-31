import { Suspense } from "react";
import ProductDetails from "./ProductDetails";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fffdfc] p-12 text-center text-[#63452f]">Loading product…</div>}>
      <ProductDetails params={params} />
    </Suspense>
  );
}
