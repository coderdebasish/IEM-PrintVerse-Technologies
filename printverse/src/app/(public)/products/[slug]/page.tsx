import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetailClient } from "./ProductDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name, description")
    .eq("slug", slug)
    .single();

  return {
    title: data ? `${data.name} — PrintVerse Technologies` : "Product Details",
    description: data?.description ?? "View details and order custom 3D prints on PrintVerse.",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <ProductDetailClient product={product} />
    </div>
  );
}
