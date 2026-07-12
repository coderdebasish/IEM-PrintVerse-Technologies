import { createClient } from "@/lib/supabase/server";
import { ProductsManager } from "./ProductsManager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0B1F4D]">Products</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your 3D print catalog.</p>
      </div>
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load products: {error.message}
        </div>
      ) : (
        <ProductsManager initialProducts={products ?? []} />
      )}
    </div>
  );
}
