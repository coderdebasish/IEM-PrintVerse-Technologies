import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductsGrid } from "./ProductsGrid";
import type { ProductCategory } from "@/types";

export const metadata: Metadata = {
  title: "Products — 3D Printed Catalog",
  description:
    "Browse PrintVerse Technologies' catalog of 3D printed products — Heritage, Gift, Home, Kids, Office, Engineering. Flat ₹4/gram pricing.",
};

const CATEGORIES: ProductCategory[] = [
  "Heritage",
  "Gift",
  "Home",
  "Kids",
  "Office",
  "Engineering",
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = CATEGORIES.includes(
    params.category as ProductCategory
  )
    ? (params.category as ProductCategory)
    : null;

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (activeCategory) {
    query = query.eq("category", activeCategory);
  }

  const { data: products, error } = await query;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <section className="bg-hero-gradient text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="ribbon-badge mb-6 inline-flex">₹4 / gram · All Categories</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Our <span style={{ color: "#D4A017" }}>3D Print</span> Catalog
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            Every product at a flat <strong className="text-white">₹4/gram</strong>.
            Buy directly or request a custom quote.
          </p>
        </div>
      </section>

      {/* Category filter tabs */}
      <section className="bg-white border-b border-[#e2e8f0] sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            <a
              href="/products"
              className={[
                "shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                !activeCategory
                  ? "bg-[#0B1F4D] text-white"
                  : "text-[#64748b] hover:text-[#0B1F4D] hover:bg-[#f8f9fb]",
              ].join(" ")}
            >
              All
            </a>
            {CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`/products?category=${cat}`}
                className={[
                  "shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  activeCategory === cat
                    ? "bg-[#0B1F4D] text-white"
                    : "text-[#64748b] hover:text-[#0B1F4D] hover:bg-[#f8f9fb]",
                ].join(" ")}
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto px-0 sm:px-2 lg:px-4">
          {error ? (
            <div className="text-center py-24">
              <p className="text-slate-500">Failed to load products. Please refresh.</p>
            </div>
          ) : (
            <ProductsGrid
              products={products ?? []}
              activeCategory={activeCategory}
            />
          )}
        </div>
      </section>
    </div>
  );
}
