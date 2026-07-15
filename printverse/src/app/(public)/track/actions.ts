"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function requestCancellation(
  trackingId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!trackingId || trackingId.length !== 6 || !/^\d{6}$/.test(trackingId)) {
    return { success: false, error: "Invalid tracking ID." };
  }
  if (!reason || reason.trim().length < 10) {
    return { success: false, error: "Cancellation reason must be at least 10 characters." };
  }

  const service = createServiceClient();

  // Find order
  const { data: order, error: fetchError } = await service
    .from("orders")
    .select("id, status")
    .eq("tracking_id", trackingId)
    .single();

  if (fetchError || !order) {
    return { success: false, error: "Order not found." };
  }

  // Check if status allows cancellation request
  if (
    order.status === "Cancelled" ||
    order.status === "Shipped" ||
    order.status === "Completed"
  ) {
    return {
      success: false,
      error: `Cannot request cancellation for an order that is already ${order.status.toLowerCase()}.`,
    };
  }

  // Update order
  const { error: updateError } = await service
    .from("orders")
    .update({
      cancellation_requested: true,
      cancellation_requested_reason: reason.trim(),
    })
    .eq("id", order.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/track`);
  revalidatePath(`/admin/orders/${order.id}`);
  return { success: true };
}
