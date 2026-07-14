import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckoutForm } from "./CheckoutForm";

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
    title: data ? `Buy ${data.name}` : "Buy Now",
    description: data?.description ?? "Complete your PrintVerse purchase.",
  };
}

export default async function BuyPage({
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
    .eq("is_available", true)
    .single();

  if (!product || product.is_coming_soon) notFound();

  // Fetch delivery rate for preview
  const { data: settingRow } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "delivery_flat_rate")
    .single();
  const deliveryCharge = parseFloat(settingRow?.value ?? "80");

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <section className="bg-hero-gradient text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="ribbon-badge mb-5 inline-flex">Secure Checkout · Razorpay</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Buy <span style={{ color: "#D4A017" }}>{product.name}</span>
          </h1>
          <p className="text-slate-300 text-base">
            Fill in your details below. Payment is collected via Razorpay.
          </p>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <CheckoutForm product={product} deliveryCharge={deliveryCharge} />
        </div>
      </section>
    </div>
  );
}
