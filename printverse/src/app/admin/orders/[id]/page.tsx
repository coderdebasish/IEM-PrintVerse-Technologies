import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { OrderDetailClient } from "./OrderDetailClient";
import type { Quotation } from "@/types";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, products(id, name, price, image_url), feedback(*)")
    .eq("id", id)
    .single();

  if (error || !order) notFound();

  // Fetch associated quotation (may be null)
  const { data: quotation } = await serviceClient
    .from("quotations")
    .select("*")
    .eq("order_id", id)
    .maybeSingle();

  return (
    <OrderDetailClient
      order={order}
      initialQuotation={(quotation as Quotation) ?? null}
    />
  );
}
