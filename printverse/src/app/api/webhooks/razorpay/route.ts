import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/razorpay
 * Verifies Razorpay webhook signature (raw body HMAC-SHA256).
 * Handles payment_link.paid to mark order as paid.
 */
export async function POST(request: NextRequest) {
  // ── 1. Read raw body ────────────────────────────────────────────────────────
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  // ── 2. Verify HMAC-SHA256 signature ──────────────────────────────────────────
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    )
  ) {
    console.error("[Razorpay Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── 3. Parse event ──────────────────────────────────────────────────────────
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event as string;

  // ── 4. Handle payment_link.paid ─────────────────────────────────────────────
  if (eventType === "payment_link.paid") {
    const payload = (event.payload as Record<string, unknown>)
      ?.payment_link as Record<string, unknown>;
    const entity = payload?.entity as Record<string, unknown>;
    const notes = entity?.notes as Record<string, string> | undefined;

    const orderId = notes?.order_id;
    const orderType = notes?.order_type;

    if (!orderId) {
      console.warn("[Razorpay Webhook] No order_id in notes");
      return NextResponse.json({ received: true });
    }

    const service = createServiceClient();

    // Determine new status based on order type
    const newStatus =
      orderType === "purchase" ? "Payment Received" : "Paid";

    const { data: order, error } = await service
      .from("orders")
      .update({
        status: newStatus,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("email, customer_name, tracking_id, order_type")
      .single();

    if (error || !order) {
      console.error("[Razorpay Webhook] DB update error:", error);
      // Return 200 anyway so Razorpay doesn't retry endlessly
      return NextResponse.json({ received: true });
    }

    console.log(`[Razorpay Webhook] Order ${order.tracking_id} marked as ${newStatus}`);

    // ── 5. Send payment confirmation email ─────────────────────────────────────
    try {
      await sendEmail({
        to: order.email,
        subject: `Payment Received — PrintVerse Order #${order.tracking_id}`,
        html: paymentConfirmationEmailHtml({
          customer_name: order.customer_name,
          tracking_id: order.tracking_id,
          status: newStatus,
          order_type: order.order_type,
        }),
      });

      // Notify admin
      await sendEmail({
        to: process.env.ADMIN_EMAIL!,
        subject: `💰 Payment Received — Order #${order.tracking_id}`,
        html: `<p>Order <strong>${order.tracking_id}</strong> (${order.order_type}) has been paid.<br>
          Customer: ${order.customer_name} · ${order.email}<br>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${orderId}">View in Admin →</a></p>`,
      });
    } catch (emailError) {
      console.error("[Razorpay Webhook] Email error (non-blocking):", emailError);
    }
  }

  return NextResponse.json({ received: true });
}

function paymentConfirmationEmailHtml({
  customer_name,
  tracking_id,
  status,
  order_type,
}: {
  customer_name: string;
  tracking_id: string;
  status: string;
  order_type: string;
}) {
  const isPurchase = order_type === "purchase";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Payment Received</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f8f9fb;padding:24px;">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(11,31,77,.08);">
    <div style="background:#15803d;padding:28px 32px;">
      <h1 style="color:#fff;font-size:18px;margin:0;font-weight:900;">✓ Payment Received!</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#0B1F4D;font-size:15px;">Hi <strong>${customer_name}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;">We've received your payment for order <strong style="color:#0B1F4D;">#${tracking_id}</strong>.</p>
      ${isPurchase
        ? `<p style="color:#475569;font-size:14px;line-height:1.6;">Our team will call you to <strong>confirm your order</strong> before we begin printing. Please keep your phone available.</p>`
        : `<p style="color:#475569;font-size:14px;line-height:1.6;">We'll begin printing your order shortly and notify you with updates.</p>`
      }
      <div style="margin:24px 0;padding:16px;background:#f0f4ff;border-radius:12px;text-align:center;">
        <p style="color:#64748b;font-size:11px;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Status</p>
        <p style="color:#0B1F4D;font-size:20px;font-weight:900;margin:0;">${status}</p>
      </div>
      <p style="color:#475569;font-size:13px;">Track your order at <a href="${process.env.NEXT_PUBLIC_SITE_URL}/track" style="color:#C41E2C;font-weight:600;">printverse.in/track</a> using ID <strong>${tracking_id}</strong></p>
    </div>
    <div style="background:#f8f9fb;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">© ${new Date().getFullYear()} PrintVerse Technologies · IIFR Lab, IEM Kolkata</p>
    </div>
  </div>
</body></html>`;
}
