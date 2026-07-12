"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
}

export async function updateDeliveryRate(
  rate: number
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  if (isNaN(rate) || rate < 0)
    return { success: false, error: "Delivery rate must be 0 or positive." };

  const service = createServiceClient();
  const { error } = await service
    .from("settings")
    .upsert({ key: "delivery_flat_rate", value: rate.toString() });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/settings");
  return { success: true };
}
