import { createServiceClient } from "@/lib/supabase/server";
import { OfflineInvoiceBuilder } from "./OfflineInvoiceBuilder";
import type { OfflineInvoice } from "@/types";

export const dynamic = "force-dynamic";

export default async function OfflineInvoicePage() {
  const service = createServiceClient();

  const { data } = await service
    .from("offline_invoices")
    .select("*")
    .order("created_at", { ascending: false });

  return <OfflineInvoiceBuilder initialDocs={(data ?? []) as OfflineInvoice[]} />;
}
