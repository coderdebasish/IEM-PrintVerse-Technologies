"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Razorpay from "razorpay";
import { sendEmail } from "@/lib/email";
import { generateInvoicePDF } from "@/lib/invoice/generateInvoicePDF";
import type { OrderStatus } from "@/types";

// ─── Guard: verify admin session ─────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

// ─── Update order status ──────────────────────────────────────────────────────
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  extraFields?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  const updateData: Record<string, unknown> = {
    status: newStatus,
    ...extraFields,
  };

  const { data: order, error } = await service
    .from("orders")
    .update(updateData)
    .eq("id", orderId)
    .select("email, customer_name, tracking_id")
    .single();

  if (error) return { success: false, error: error.message };

  // Fire-and-forget status update email
  try {
    await sendEmail({
      to: order.email,
      subject: `PrintVerse Order Update — ${order.tracking_id} is now "${newStatus}"`,
      html: statusUpdateEmailHtml({
        customer_name: order.customer_name,
        tracking_id: order.tracking_id,
        newStatus,
      }),
    });
  } catch (e) {
    console.error("Status email error (non-blocking):", e);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/dashboard");
  return { success: true };
}

// ─── Set quoted price (quote flow) ────────────────────────────────────────────
export async function setQuotedPrice(
  orderId: string,
  price: number
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  if (price <= 0) return { success: false, error: "Price must be positive." };
  const service = createServiceClient();
  const { error } = await service
    .from("orders")
    .update({ quoted_price: price })
    .eq("id", orderId);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

// ─── Generate Razorpay payment link ──────────────────────────────────────────
export async function generatePaymentLink(
  orderId: string
): Promise<{ success: boolean; paymentLink?: string; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  const { data: order, error: fetchError } = await service
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) return { success: false, error: "Order not found." };

  const amount =
    order.order_type === "quote"
      ? order.quoted_price
      : order.total_amount;

  if (!amount || amount <= 0)
    return { success: false, error: "Amount not set. Set price before generating link." };

  const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const link = await rzp.paymentLink.create({
    amount: Math.round(amount * 100), // paise
    currency: "INR",
    description: `PrintVerse Order #${order.tracking_id}`,
    customer: {
      name: order.customer_name,
      email: order.email,
      contact: order.phone,
    },
    notify: { sms: false, email: false }, // we handle emails
    notes: { order_id: orderId, tracking_id: order.tracking_id, order_type: order.order_type },
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/track`,
    callback_method: "get",
  });

  const { error: updateError } = await service
    .from("orders")
    .update({ payment_link: link.short_url, status: "Payment Pending" })
    .eq("id", orderId);

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, paymentLink: link.short_url };
}

// ─── Mark confirmed via call (purchase flow) ──────────────────────────────────
export async function markConfirmedViaCall(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  return updateOrderStatus(orderId, "Confirmed", {
    confirmed_via_call: true,
    confirmed_at: new Date().toISOString(),
  });
}

// ─── Cancel order ─────────────────────────────────────────────────────────────
export async function cancelOrder(
  orderId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  if (!reason.trim() || reason.trim().length < 10)
    return { success: false, error: "Cancellation reason must be at least 10 characters." };

  const service = createServiceClient();
  const { data: order, error } = await service
    .from("orders")
    .update({ status: "Cancelled", cancellation_reason: reason.trim() })
    .eq("id", orderId)
    .select("email, customer_name, tracking_id")
    .single();

  if (error) return { success: false, error: error.message };

  try {
    await sendEmail({
      to: order.email,
      subject: `Your PrintVerse Order ${order.tracking_id} Has Been Cancelled`,
      html: cancellationEmailHtml({
        customer_name: order.customer_name,
        tracking_id: order.tracking_id,
        reason: reason.trim(),
      }),
    });
  } catch (e) {
    console.error("Cancellation email error (non-blocking):", e);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/dashboard");
  return { success: true };
}

// ─── Release invoice (purchase flow) ─────────────────────────────────────────
export async function releaseInvoice(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  const { data: order, error: fetchError } = await service
    .from("orders")
    .select("*, products(name, price)")
    .eq("id", orderId)
    .single();

  if (fetchError || !order)
    return { success: false, error: "Order not found." };

  if (!order.confirmed_via_call)
    return {
      success: false,
      error: "Cannot release invoice before confirming via call.",
    };

  // Generate PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateInvoicePDF(order);
  } catch (e) {
    console.error("PDF generation error:", e);
    return { success: false, error: "Failed to generate invoice PDF." };
  }

  // Upload to invoices bucket
  const fileName = `invoice-${order.tracking_id}-${Date.now()}.pdf`;
  const { error: uploadError } = await service.storage
    .from("invoices")
    .upload(fileName, pdfBuffer, { contentType: "application/pdf" });

  if (uploadError)
    return { success: false, error: "Failed to upload invoice: " + uploadError.message };

  // Update order
  const { error: updateError } = await service.from("orders").update({
    invoice_released: true,
    invoice_url: fileName,
    invoice_released_at: new Date().toISOString(),
    status: "Invoice Sent",
  }).eq("id", orderId);

  if (updateError)
    return { success: false, error: updateError.message };

  // Email invoice
  try {
    await sendEmail({
      to: order.email,
      subject: `Your PrintVerse Invoice — Order #${order.tracking_id}`,
      html: invoiceEmailHtml({ customer_name: order.customer_name, tracking_id: order.tracking_id }),
      attachments: [{ filename: `PrintVerse-Invoice-${order.tracking_id}.pdf`, content: pdfBuffer }],
    });
  } catch (e) {
    console.error("Invoice email error (non-blocking):", e);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}


// ─── Email HTML builders ──────────────────────────────────────────────────────

function statusUpdateEmailHtml({ customer_name, tracking_id, newStatus }: { customer_name: string; tracking_id: string; newStatus: string }) {
  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;background:#f8f9fb;padding:24px;">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
<div style="background:#0B1F4D;padding:28px 32px;"><h1 style="color:#D4A017;font-size:20px;margin:0;font-weight:900;">PrintVerse Technologies</h1></div>
<div style="padding:32px;">
<p style="color:#0B1F4D;font-size:16px;">Hi <strong>${customer_name}</strong>,</p>
<p style="color:#475569;font-size:14px;">Your order <strong style="color:#0B1F4D;">#${tracking_id}</strong> status has been updated to:</p>
<div style="background:#0B1F4D;color:#D4A017;font-size:20px;font-weight:900;padding:16px 24px;border-radius:12px;margin:20px 0;text-align:center;">${newStatus}</div>
<p style="color:#475569;font-size:13px;">Track your full order at <a href="${process.env.NEXT_PUBLIC_SITE_URL}/track" style="color:#C41E2C;">printverse.in/track</a> using your tracking ID.</p>
</div>
</div></body></html>`;
}

function cancellationEmailHtml({ customer_name, tracking_id, reason }: { customer_name: string; tracking_id: string; reason: string }) {
  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;background:#f8f9fb;padding:24px;">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
<div style="background:#C41E2C;padding:28px 32px;"><h1 style="color:#fff;font-size:20px;margin:0;font-weight:900;">Order Cancelled — #${tracking_id}</h1></div>
<div style="padding:32px;">
<p style="color:#0B1F4D;font-size:16px;">Hi <strong>${customer_name}</strong>,</p>
<p style="color:#475569;font-size:14px;">We regret to inform you that your order <strong>#${tracking_id}</strong> has been cancelled.</p>
<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:12px;padding:16px;margin:20px 0;">
<p style="color:#991b1b;font-size:13px;margin:0;"><strong>Reason:</strong> ${reason}</p>
</div>
<p style="color:#475569;font-size:13px;">If you paid for this order, please contact us on WhatsApp or email — refunds are processed through Razorpay within 5-7 business days.</p>
</div></div></body></html>`;
}

function invoiceEmailHtml({ customer_name, tracking_id }: { customer_name: string; tracking_id: string }) {
  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;background:#f8f9fb;padding:24px;">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
<div style="background:#0B1F4D;padding:28px 32px;"><h1 style="color:#D4A017;font-size:20px;margin:0;font-weight:900;">PrintVerse Technologies</h1></div>
<div style="padding:32px;">
<p style="color:#0B1F4D;font-size:16px;">Hi <strong>${customer_name}</strong>,</p>
<p style="color:#475569;font-size:14px;">Your invoice for order <strong>#${tracking_id}</strong> is attached to this email. Your order is confirmed and will move to printing shortly.</p>
<p style="color:#475569;font-size:13px;">Track at <a href="${process.env.NEXT_PUBLIC_SITE_URL}/track" style="color:#C41E2C;">printverse.in/track</a></p>
</div></div></body></html>`;
}

// ─── Feedback System Actions ──────────────────────────────────────────────────

export async function sendFeedbackRequest(
  orderId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  const { data: order, error: fetchError } = await service
    .from("orders")
    .select("tracking_id, feedback_token")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) return { success: false, error: "Order not found." };

  let token = order.feedback_token;
  if (!token) {
    const crypto = await import("crypto");
    token = crypto.randomUUID();
    const { error: updateError } = await service
      .from("orders")
      .update({
        feedback_token: token,
        feedback_requested_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) return { success: false, error: updateError.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, token };
}

export async function toggleFeedbackApproval(
  feedbackId: string,
  orderId: string,
  isApproved: boolean
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  const { error } = await service
    .from("feedback")
    .update({ is_approved: isApproved })
    .eq("id", feedbackId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/home");
  return { success: true };
}

export async function toggleFeedbackPublish(
  feedbackId: string,
  orderId: string,
  isPublished: boolean
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  const { error } = await service
    .from("feedback")
    .update({ is_published: isPublished })
    .eq("id", feedbackId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/home");
  return { success: true };
}
