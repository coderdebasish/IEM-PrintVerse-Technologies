"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Razorpay from "razorpay";
import { sendEmail } from "@/lib/email";
import { generateDocumentPDF } from "@/lib/invoice/generateDocumentPDF";
import type { OrderStatus, Quotation, QuotationItem, DiscountType } from "@/types";

// ─── Guard: verify admin session ─────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  // When admin marks as "Paid" → auto-convert quotation to invoice
  if (newStatus === "Paid" || newStatus === "Payment Received") {
    try {
      await convertToInvoice(orderId);
    } catch (e) {
      console.error("Auto-invoice conversion error (non-blocking):", e);
    }
  }

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
    order.order_type === "quote" ? order.quoted_price : order.total_amount;

  if (!amount || amount <= 0)
    return {
      success: false,
      error: "Amount not set. Set price before generating link.",
    };

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
    notify: { sms: false, email: false },
    notes: {
      order_id: orderId,
      tracking_id: order.tracking_id,
      order_type: order.order_type,
    },
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
    return {
      success: false,
      error: "Cancellation reason must be at least 10 characters.",
    };

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

// ─── Quotation CRUD ───────────────────────────────────────────────────────────

export interface QuotationFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  issue_date: string;
  valid_until: string;
  items: QuotationItem[];
  discount_type: DiscountType;
  discount_value: number;
  notes: string;
}

function calculateFinancials(
  items: QuotationItem[],
  discountType: DiscountType,
  discountValue: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = (subtotal * discountValue) / 100;
  } else if (discountType === "fixed") {
    discountAmount = Math.min(discountValue, subtotal);
  }
  const total = subtotal - discountAmount;
  const itemsWithAmount = items.map((item) => ({
    ...item,
    amount: item.qty * item.rate,
  }));
  return { subtotal, discountAmount, total, itemsWithAmount };
}

/** Fetch the existing quotation for an order (returns null if none) */
export async function getQuotation(
  orderId: string
): Promise<Quotation | null> {
  await requireAdmin();
  const service = createServiceClient();
  const { data } = await service
    .from("quotations")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  return (data as Quotation) ?? null;
}

/** Create a brand-new quotation, generate PDF, upload to storage */
export async function createQuotation(
  orderId: string,
  formData: QuotationFormData
): Promise<{ success: boolean; quotation?: Quotation; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  // Fetch order for tracking_id
  const { data: order, error: oErr } = await service
    .from("orders")
    .select("tracking_id, email, customer_name")
    .eq("id", orderId)
    .single();
  if (oErr || !order) return { success: false, error: "Order not found." };

  const { subtotal, discountAmount, total, itemsWithAmount } =
    calculateFinancials(
      formData.items,
      formData.discount_type,
      formData.discount_value
    );

  const quotationNumber = `QT-${order.tracking_id}`;

  const quotationPayload: Omit<Quotation, "id" | "created_at" | "updated_at"> =
    {
      order_id: orderId,
      tracking_id: order.tracking_id,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      customer_phone: formData.customer_phone,
      customer_address: formData.customer_address || null,
      quotation_number: quotationNumber,
      issue_date: formData.issue_date,
      valid_until: formData.valid_until || null,
      items: itemsWithAmount,
      subtotal,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      discount_amount: discountAmount,
      total,
      notes: formData.notes || null,
      quotation_pdf_path: null,
      invoice_pdf_path: null,
      doc_type: "quotation",
    };

  // Insert quotation row
  const { data: newQuotation, error: insertErr } = await service
    .from("quotations")
    .insert(quotationPayload)
    .select()
    .single();

  if (insertErr || !newQuotation)
    return { success: false, error: insertErr?.message ?? "Insert failed." };

  // Generate PDF
  const pdfBuffer = await generateDocumentPDF(newQuotation as Quotation);

  // Upload to storage
  const pdfPath = `quotations/QT-${order.tracking_id}.pdf`;
  const { error: uploadErr } = await service.storage
    .from("invoices")
    .upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadErr)
    return { success: false, error: "PDF upload failed: " + uploadErr.message };

  // Update row with PDF path
  const { data: updatedQuotation, error: updateErr } = await service
    .from("quotations")
    .update({ quotation_pdf_path: pdfPath })
    .eq("id", newQuotation.id)
    .select()
    .single();

  if (updateErr)
    return { success: false, error: updateErr.message };

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, quotation: updatedQuotation as Quotation };
}

/** Update existing quotation, re-generate PDF, replace in storage */
export async function updateQuotation(
  quotationId: string,
  orderId: string,
  formData: QuotationFormData
): Promise<{ success: boolean; quotation?: Quotation; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  const { data: existing, error: fetchErr } = await service
    .from("quotations")
    .select("*")
    .eq("id", quotationId)
    .single();

  if (fetchErr || !existing)
    return { success: false, error: "Quotation not found." };
  if ((existing as Quotation).doc_type === "invoice")
    return { success: false, error: "Invoice cannot be edited." };

  const { subtotal, discountAmount, total, itemsWithAmount } =
    calculateFinancials(
      formData.items,
      formData.discount_type,
      formData.discount_value
    );

  const updatePayload = {
    customer_name: formData.customer_name,
    customer_email: formData.customer_email,
    customer_phone: formData.customer_phone,
    customer_address: formData.customer_address || null,
    issue_date: formData.issue_date,
    valid_until: formData.valid_until || null,
    items: itemsWithAmount,
    subtotal,
    discount_type: formData.discount_type,
    discount_value: formData.discount_value,
    discount_amount: discountAmount,
    total,
    notes: formData.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedQuotation, error: updateErr } = await service
    .from("quotations")
    .update(updatePayload)
    .eq("id", quotationId)
    .select()
    .single();

  if (updateErr || !updatedQuotation)
    return { success: false, error: updateErr?.message ?? "Update failed." };

  // Re-generate PDF
  const pdfBuffer = await generateDocumentPDF(updatedQuotation as Quotation);

  // Upsert (replace) in storage
  const pdfPath = `quotations/QT-${(existing as Quotation).tracking_id}.pdf`;
  const { error: uploadErr } = await service.storage
    .from("invoices")
    .upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadErr)
    return { success: false, error: "PDF upload failed: " + uploadErr.message };

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, quotation: updatedQuotation as Quotation };
}

/** Convert existing quotation → Invoice PDF. Called automatically when status = "Paid". */
export async function convertToInvoice(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const service = createServiceClient();

  const { data: quotation, error: fetchErr } = await service
    .from("quotations")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (fetchErr || !quotation) return { success: false, error: "No quotation found for this order." };
  if ((quotation as Quotation).doc_type === "invoice") return { success: true }; // Already converted

  // Build invoice quotation object
  const invoiceData: Quotation = {
    ...(quotation as Quotation),
    doc_type: "invoice",
    issue_date: new Date().toISOString().split("T")[0],
  };

  // Generate invoice PDF
  const pdfBuffer = await generateDocumentPDF(invoiceData);

  // Upload invoice PDF
  const invoicePath = `invoices/INV-${(quotation as Quotation).tracking_id}.pdf`;
  const { error: uploadErr } = await service.storage
    .from("invoices")
    .upload(invoicePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadErr)
    return { success: false, error: "Invoice PDF upload failed: " + uploadErr.message };

  // Update quotation row
  const { error: updateErr } = await service
    .from("quotations")
    .update({
      doc_type: "invoice",
      invoice_pdf_path: invoicePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", (quotation as Quotation).id);

  if (updateErr) return { success: false, error: updateErr.message };

  // Email the customer
  try {
    const { data: order } = await service
      .from("orders")
      .select("email, customer_name, tracking_id")
      .eq("id", orderId)
      .single();

    if (order) {
      await sendEmail({
        to: order.email,
        subject: `Your PrintVerse Invoice — Order #${order.tracking_id}`,
        html: invoiceEmailHtml({
          customer_name: order.customer_name,
          tracking_id: order.tracking_id,
        }),
        attachments: [
          {
            filename: `PrintVerse-Invoice-${order.tracking_id}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
    }
  } catch (e) {
    console.error("Invoice email error (non-blocking):", e);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

// ─── Legacy releaseInvoice (kept for purchase orders without quotation) ────────
export async function releaseInvoice(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  // If a quotation exists, just convert it
  const service = createServiceClient();
  const { data: qt } = await service
    .from("quotations")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (qt) return convertToInvoice(orderId);

  // Fallback: mark invoice_released manually for old purchase orders
  const { error } = await service
    .from("orders")
    .update({
      invoice_released: true,
      invoice_released_at: new Date().toISOString(),
      status: "Invoice Sent",
    })
    .eq("id", orderId);

  if (error) return { success: false, error: error.message };
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

/** Manually convert an existing quotation to an Invoice from the admin UI. */
export async function manualConvertToInvoice(
  orderId: string
): Promise<{ success: boolean; quotation?: Quotation; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  const { data: quotation, error: fetchErr } = await service
    .from("quotations")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (fetchErr || !quotation)
    return { success: false, error: "No quotation found for this order." };
  if ((quotation as Quotation).doc_type === "invoice")
    return { success: false, error: "Already an invoice." };

  // Build invoice data
  const invoiceData: Quotation = {
    ...(quotation as Quotation),
    doc_type: "invoice",
    issue_date: new Date().toISOString().split("T")[0],
  };

  // Generate invoice PDF
  const { generateDocumentPDF } = await import("@/lib/invoice/generateDocumentPDF");
  const pdfBuffer = await generateDocumentPDF(invoiceData);

  const invoicePath = `invoices/INV-${(quotation as Quotation).tracking_id}.pdf`;
  const { error: uploadErr } = await service.storage
    .from("invoices")
    .upload(invoicePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (uploadErr)
    return { success: false, error: "PDF upload failed: " + uploadErr.message };

  const { data: updated, error: updateErr } = await service
    .from("quotations")
    .update({
      doc_type: "invoice",
      invoice_pdf_path: invoicePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", (quotation as Quotation).id)
    .select()
    .single();

  if (updateErr || !updated)
    return { success: false, error: updateErr?.message ?? "Update failed." };

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, quotation: updated as Quotation };
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

// ─── Email HTML builders ──────────────────────────────────────────────────────

function statusUpdateEmailHtml({
  customer_name,
  tracking_id,
  newStatus,
}: {
  customer_name: string;
  tracking_id: string;
  newStatus: string;
}) {
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

function cancellationEmailHtml({
  customer_name,
  tracking_id,
  reason,
}: {
  customer_name: string;
  tracking_id: string;
  reason: string;
}) {
  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;background:#f8f9fb;padding:24px;">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
<div style="background:#C41E2C;padding:28px 32px;"><h1 style="color:#fff;font-size:20px;margin:0;font-weight:900;">Order Cancelled — #${tracking_id}</h1></div>
<div style="padding:32px;">
<p style="color:#0B1F4D;font-size:16px;">Hi <strong>${customer_name}</strong>,</p>
<p style="color:#475569;font-size:14px;">We regret to inform you that your order <strong>#${tracking_id}</strong> has been cancelled.</p>
<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:12px;padding:16px;margin:20px 0;">
<p style="color:#991b1b;font-size:13px;margin:0;"><strong>Reason:</strong> ${reason}</p>
</div>
<p style="color:#475569;font-size:13px;">If you paid for this order, please contact us — refunds are processed within 5-7 business days.</p>
</div></div></body></html>`;
}

function invoiceEmailHtml({
  customer_name,
  tracking_id,
}: {
  customer_name: string;
  tracking_id: string;
}) {
  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;background:#f8f9fb;padding:24px;">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
<div style="background:#0B1F4D;padding:28px 32px;"><h1 style="color:#D4A017;font-size:20px;margin:0;font-weight:900;">PrintVerse Technologies</h1></div>
<div style="padding:32px;">
<p style="color:#0B1F4D;font-size:16px;">Hi <strong>${customer_name}</strong>,</p>
<p style="color:#475569;font-size:14px;">Your invoice for order <strong>#${tracking_id}</strong> is attached to this email. Your order is confirmed and will move to printing shortly.</p>
<p style="color:#475569;font-size:13px;">Track at <a href="${process.env.NEXT_PUBLIC_SITE_URL}/track" style="color:#C41E2C;">printverse.in/track</a></p>
</div></div></body></html>`;
}
