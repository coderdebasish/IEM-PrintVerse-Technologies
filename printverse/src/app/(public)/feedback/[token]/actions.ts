"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitFeedback(
  token: string,
  formData: { rating: number; title: string; message: string }
): Promise<{ success: boolean; error?: string }> {
  const rating = Number(formData.rating);
  if (!rating || rating < 1 || rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5 stars." };
  }
  if (!formData.message?.trim()) {
    return { success: false, error: "Feedback message cannot be empty." };
  }

  const service = createServiceClient();

  // Find order by token
  const { data: order, error: fetchError } = await service
    .from("orders")
    .select("id, tracking_id, customer_name")
    .eq("feedback_token", token)
    .single();

  if (fetchError || !order) {
    return { success: false, error: "Invalid or expired feedback link." };
  }

  // Check if feedback already exists for this order
  const { data: existingFeedback } = await service
    .from("feedback")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();

  if (existingFeedback) {
    return { success: false, error: "Feedback has already been submitted for this order." };
  }

  // Insert feedback
  const { error: insertError } = await service.from("feedback").insert({
    order_id: order.id,
    tracking_id: order.tracking_id,
    customer_name: order.customer_name,
    rating,
    title: formData.title?.trim() || null,
    message: formData.message.trim(),
    is_approved: false, // Needs manual approval
    is_published: false, // Needs manual approval
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  revalidatePath(`/admin/orders/${order.id}`);
  return { success: true };
}
