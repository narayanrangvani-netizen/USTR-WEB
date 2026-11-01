import { Showroom, type RackFilter } from "@/components/storefront/Showroom";

export function CategoryPage({
  gender,
  productType,
}: {
  gender?: "Men" | "Women";
  title: string;
  productType?: "T-shirts" | "Shirts";
}) {
  const initialFilter: RackFilter = productType === "T-shirts"
    ? "t-shirts"
    : productType === "Shirts"
      ? "shirts"
      : gender === "Women"
        ? "women"
        : gender === "Men"
          ? "men"
          : "all";
  return <Showroom key={initialFilter} initialFilter={initialFilter} />;
}
