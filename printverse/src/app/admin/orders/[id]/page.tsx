import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { OrderDetailClient } from "./OrderDetailClient";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, products(id, name, price, image_url), feedback(*)")
    .eq("id", id)
    .single();

  if (error || !order) notFound();

  return <OrderDetailClient order={order} />;
}
