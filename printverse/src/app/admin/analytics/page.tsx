import { createServiceClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "./AnalyticsClient";
import type { Order, Quotation } from "@/types";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const service = createServiceClient();

  const [{ data: orders }, { data: quotations }] = await Promise.all([
    service.from("orders").select("*").order("created_at", { ascending: true }),
    service.from("quotations").select("*").order("created_at", { ascending: true }),
  ]);

  return (
    <AnalyticsClient
      orders={(orders ?? []) as Order[]}
      quotations={(quotations ?? []) as Quotation[]}
    />
  );
}
