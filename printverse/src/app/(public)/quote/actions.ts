"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { quoteFormSchema } from "@/lib/validations/schemas";
import { generateUniqueTrackingId } from "@/lib/utils/trackingId";
import { sendEmail } from "@/lib/email";
import type { QuoteFormData } from "@/lib/validations/schemas";

export type QuoteActionResult =
  | { success: true; trackingId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function submitQuote(
  formData: QuoteFormData & { stlBase64?: string; stlFileName?: string }
): Promise<QuoteActionResult> {
  // ── 1. Server-side validation ─────────────────────────────────────────────
  const parsed = quoteFormSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed. Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { customer_name, email, phone, message, print_preferences } = parsed.data;
  const serviceClient = createServiceClient();

  // ── 2. Upload STL file if provided ────────────────────────────────────────
  let stlFileUrl: string | null = null;
  if (formData.stlBase64 && formData.stlFileName) {
    try {
      const base64Data = formData.stlBase64.split(",")[1] ?? formData.stlBase64;
      const buffer = Buffer.from(base64Data, "base64");

      // Server-side STL magic byte check
      const isTextSTL = buffer.slice(0, 5).toString("ascii").toLowerCase().includes("solid");
      const isBinarySTL = buffer.length > 80;
      if (!isTextSTL && !isBinarySTL) {
        return { success: false, error: "Invalid STL file. Please upload a valid .stl file." };
      }

      const fileName = `${Date.now()}-${formData.stlFileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { data: uploadData, error: uploadError } = await serviceClient.storage
        .from("stl-uploads")
        .upload(fileName, buffer, {
          contentType: "model/stl",
          upsert: false,
        });

      if (uploadError) throw uploadError;
      stlFileUrl = uploadData.path;
    } catch (err) {
      console.error("STL upload error:", err);
      return { success: false, error: "Failed to upload STL file. Please try again." };
    }
  }

  // ── 3. Generate unique tracking ID ───────────────────────────────────────
  let trackingId: string;
  try {
    trackingId = await generateUniqueTrackingId(serviceClient);
  } catch {
    return {
      success: false,
      error: "Unable to process your request right now. Please try again.",
    };
  }

  // ── 4. Insert order ───────────────────────────────────────────────────────
  const { error: insertError } = await serviceClient.from("orders").insert({
    tracking_id: trackingId,
    order_type: "quote",
    customer_name,
    email,
    phone,
    stl_file_url: stlFileUrl,
    message: message || null,
    print_preferences: print_preferences || null,
    status: "Requested",
  });

  if (insertError) {
    console.error("Order insert error:", insertError);
    return {
      success: false,
      error: "Failed to submit your request. Please try again.",
    };
  }

  // ── 5. Send emails (fire-and-forget — errors must not block the user) ────
  try {
    await Promise.allSettled([
      sendEmail({
        to: email,
        subject: `Your PrintVerse Quote Request — Tracking ID: ${trackingId}`,
        html: quoteConfirmationEmailHtml({ customer_name, trackingId }),
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL!,
        subject: `New Quote Request — ${trackingId} from ${customer_name}`,
        html: newQuoteAdminEmailHtml({ customer_name, email, phone, trackingId, message, print_preferences }),
      }),
    ]);
  } catch (err) {
    console.error("Email send error (non-blocking):", err);
  }

  return { success: true, trackingId };
}

// ── Email HTML builders ────────────────────────────────────────────────────

function quoteConfirmationEmailHtml({
  customer_name,
  trackingId,
}: {
  customer_name: string;
  trackingId: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Quote Request Received</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f8f9fb;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(11,31,77,0.08);">
    <div style="background:#0B1F4D;padding:32px 40px;text-align:center;">
      <h1 style="color:#D4A017;font-size:22px;margin:0;font-weight:900;">PrintVerse Technologies</h1>
      <p style="color:#94a3b8;font-size:13px;margin:8px 0 0;">Where Every Idea Takes Shape</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#0B1F4D;font-size:16px;margin:0 0 16px;">Hi <strong>${customer_name}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">Thank you for your quote request! We've received your details and our team will review it and get back to you within <strong>24 hours</strong>.</p>
      <div style="background:#f0f4ff;border:2px dashed #0B1F4D;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
        <p style="color:#64748b;font-size:12px;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Your Tracking ID</p>
        <p style="color:#0B1F4D;font-size:36px;font-weight:900;margin:0;letter-spacing:.1em;">${trackingId}</p>
        <p style="color:#C41E2C;font-size:12px;margin:8px 0 0;font-weight:600;">⚠ Save this ID — it's your only reference for this order</p>
      </div>
      <p style="color:#475569;font-size:14px;line-height:1.6;">You can track your order status anytime at <a href="${process.env.NEXT_PUBLIC_SITE_URL}/track" style="color:#C41E2C;font-weight:600;">printverse.in/track</a></p>
    </div>
    <div style="background:#f8f9fb;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">© ${new Date().getFullYear()} PrintVerse Technologies · Powered by IIFR Lab, IEM Kolkata</p>
    </div>
  </div>
</body></html>`;
}

function newQuoteAdminEmailHtml({
  customer_name,
  email,
  phone,
  trackingId,
  message,
  print_preferences,
}: {
  customer_name: string;
  email: string;
  phone: string;
  trackingId: string;
  message?: string | null;
  print_preferences?: Record<string, unknown> | null;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Quote Request</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f8f9fb;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
    <div style="background:#C41E2C;padding:24px 32px;">
      <h1 style="color:#fff;font-size:18px;margin:0;font-weight:900;">New Quote Request — ${trackingId}</h1>
    </div>
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#64748b;width:140px;">Name</td><td style="color:#0B1F4D;font-weight:600;">${customer_name}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="color:#0B1F4D;">${email}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Phone</td><td style="color:#0B1F4D;">${phone}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Tracking ID</td><td style="color:#0B1F4D;font-weight:900;font-size:18px;">${trackingId}</td></tr>
        ${message ? `<tr><td style="padding:8px 0;color:#64748b;vertical-align:top;">Message</td><td style="color:#0B1F4D;">${message}</td></tr>` : ""}
        ${print_preferences ? `<tr><td style="padding:8px 0;color:#64748b;vertical-align:top;">Preferences</td><td style="color:#0B1F4D;font-size:13px;">${JSON.stringify(print_preferences, null, 2).replace(/\n/g, "<br>")}</td></tr>` : ""}
      </table>
      <div style="margin-top:24px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders" style="display:inline-block;background:#0B1F4D;color:#fff;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">View in Admin Panel →</a>
      </div>
    </div>
  </div>
</body></html>`;
}
