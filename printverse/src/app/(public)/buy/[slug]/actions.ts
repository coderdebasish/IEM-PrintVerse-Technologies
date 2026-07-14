"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { checkoutFormSchema } from "@/lib/validations/schemas";
import { generateUniqueTrackingId } from "@/lib/utils/trackingId";
import { sendEmail } from "@/lib/email";
import type { CheckoutFormData } from "@/lib/validations/schemas";

const PRICE_PER_GRAM = 4;
const MIN_GRAMS = 50;
const MIN_PRICE = PRICE_PER_GRAM * MIN_GRAMS; // ₹200

/**
 * razorpayReady — true only when both Razorpay env vars are non-empty.
 * When false, the checkout still works: the order is saved and the admin
 * manually generates the payment link from the dashboard once Razorpay
 * merchant approval is complete.
 */
function razorpayReady(): boolean {
  return !!(
    process.env.RAZORPAY_KEY_ID?.trim() &&
    process.env.RAZORPAY_KEY_SECRET?.trim()
  );
}

export type CheckoutResult =
  | {
      success: true;
      trackingId: string;
      totalAmount: number;
      /** Present when Razorpay is live — redirect customer to pay immediately */
      paymentLink?: string;
      /** True when Razorpay is not yet enabled — admin will send link later */
      manualPayment: boolean;
    }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function submitCheckout(
  data: CheckoutFormData & { productId: string }
): Promise<CheckoutResult> {
  // ── 1. Validate ──────────────────────────────────────────────────────────────
  const parsed = checkoutFormSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed. Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const {
    customer_name, email, phone,
    delivery_address_line, delivery_city, delivery_state, delivery_pincode,
    quantity,
  } = parsed.data;

  const service = createServiceClient();

  // ── 2. Fetch product (server-authoritative price, never trust client) ─────────
  const { data: product, error: prodError } = await service
    .from("products")
    .select("id, name, price, is_available, is_coming_soon")
    .eq("id", data.productId)
    .single();

  if (prodError || !product)
    return { success: false, error: "Product not found." };

  if (!product.is_available || product.is_coming_soon)
    return { success: false, error: "This product is not currently available for purchase." };

  // ── 3. Delivery rate from settings ───────────────────────────────────────────
  const { data: settingRow } = await service
    .from("settings")
    .select("value")
    .eq("key", "delivery_flat_rate")
    .single();
  const deliveryCharge = parseFloat(settingRow?.value ?? "80");

  // ── 4. Server-authoritative total ────────────────────────────────────────────
  const subtotal = Math.max(product.price * quantity, MIN_PRICE * quantity);
  const totalAmount = subtotal + deliveryCharge;

  if (totalAmount <= 0)
    return { success: false, error: "Invalid order total." };

  // ── 5. Unique tracking ID ────────────────────────────────────────────────────
  let trackingId: string;
  try {
    trackingId = await generateUniqueTrackingId(service);
  } catch {
    return { success: false, error: "Unable to process order. Please try again." };
  }

  // ── 6. Insert order into DB ───────────────────────────────────────────────────
  const { data: inserted, error: insertError } = await service
    .from("orders")
    .insert({
      tracking_id: trackingId,
      order_type: "purchase",
      customer_name, email, phone,
      product_id: product.id,
      quantity,
      delivery_address_line,
      delivery_city,
      delivery_state,
      delivery_pincode,
      delivery_charge: deliveryCharge,
      subtotal,
      total_amount: totalAmount,
      // "Requested" if Razorpay not ready yet, "Payment Pending" if we generate a link now
      status: razorpayReady() ? "Payment Pending" : "Requested",
    })
    .select("id")
    .single();

  if (insertError || !inserted)
    return { success: false, error: "Failed to create order. Please try again." };

  // ── 7. Razorpay — only when merchant account is approved & keys are set ───────
  let paymentLink: string | undefined;

  if (razorpayReady()) {
    try {
      const Razorpay = (await import("razorpay")).default;
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      const link = await rzp.paymentLink.create({
        amount: Math.round(totalAmount * 100), // paise
        currency: "INR",
        description: `PrintVerse — ${product.name} ×${quantity} — #${trackingId}`,
        customer: { name: customer_name, email, contact: phone },
        notify: { sms: false, email: false },
        notes: {
          order_id: inserted.id,
          tracking_id: trackingId,
          order_type: "purchase",
        },
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/track`,
        callback_method: "get",
      });

      paymentLink = link.short_url;

      await service
        .from("orders")
        .update({ payment_link: paymentLink })
        .eq("id", inserted.id);
    } catch (rzpErr) {
      // Razorpay call failed after order was saved — log it but don't fail the
      // customer. Admin can generate the link manually from the dashboard.
      console.error("[Checkout] Razorpay link generation failed (non-blocking):", rzpErr);
      paymentLink = undefined;

      // Update order status back to "Requested" so admin sees it needs attention
      await service
        .from("orders")
        .update({ status: "Requested" })
        .eq("id", inserted.id);
    }
  }

  const manualPayment = !paymentLink;

  // ── 8. Emails ─────────────────────────────────────────────────────────────────
  try {
    await Promise.allSettled([
      // Customer confirmation
      sendEmail({
        to: email,
        subject: manualPayment
          ? `Order Received — PrintVerse #${trackingId}`
          : `Complete Your Payment — PrintVerse #${trackingId}`,
        html: checkoutEmailHtml({
          customer_name, trackingId, productName: product.name,
          quantity, totalAmount, paymentLink,
        }),
      }),
      // Admin notification
      sendEmail({
        to: process.env.ADMIN_EMAIL ?? "",
        subject: `🛒 New Purchase Order — #${trackingId} — ${customer_name}`,
        html: adminNotificationHtml({
          customer_name, email, phone, trackingId,
          productName: product.name, quantity, totalAmount,
          orderId: inserted.id,
          manualPayment,
        }),
      }),
    ]);
  } catch (emailErr) {
    console.error("[Checkout] Email error (non-blocking):", emailErr);
  }

  return { success: true, trackingId, totalAmount, paymentLink, manualPayment };
}

// ── Email templates ────────────────────────────────────────────────────────────

function checkoutEmailHtml({
  customer_name, trackingId, productName, quantity, totalAmount, paymentLink,
}: {
  customer_name: string; trackingId: string; productName: string;
  quantity: number; totalAmount: number; paymentLink?: string;
}) {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918101206698";
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi PrintVerse! My order is #${trackingId}. I'm ready to pay.`)}`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Order Confirmation</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f8f9fb;padding:24px;">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(11,31,77,.08);">
    <div style="background:#0B1F4D;padding:28px 32px;">
      <h1 style="color:#D4A017;font-size:20px;margin:0;font-weight:900;">PrintVerse Technologies</h1>
      <p style="color:#94a3b8;font-size:12px;margin:6px 0 0;">Order Confirmation — #${trackingId}</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#0B1F4D;font-size:15px;">Hi <strong>${customer_name}</strong>,</p>
      ${paymentLink
        ? `<p style="color:#475569;font-size:14px;line-height:1.6;">Your order is created! Click below to complete your payment securely via Razorpay.</p>
           <div style="text-align:center;margin:28px 0;">
             <a href="${paymentLink}" style="display:inline-block;background:#C41E2C;color:#fff;padding:16px 40px;border-radius:12px;font-weight:900;font-size:16px;text-decoration:none;">Pay Now — ₹${totalAmount.toFixed(2)} →</a>
           </div>
           <p style="color:#94a3b8;font-size:12px;text-align:center;">Powered by Razorpay · Secure payment</p>`
        : `<p style="color:#475569;font-size:14px;line-height:1.6;">
             Thank you for your order! We've received it and our team will <strong>send you a payment link</strong> via WhatsApp or email within a few hours.
             <br><br>
             In the meantime you can also reach us on WhatsApp with your order ID.
           </p>
           <div style="text-align:center;margin:28px 0;">
             <a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;">WhatsApp Us →</a>
           </div>`
      }
      <div style="background:#f8f9fb;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="color:#64748b;font-size:11px;margin:0 0 6px;font-weight:600;text-transform:uppercase;">Order Summary</p>
        <p style="color:#0B1F4D;font-size:13px;margin:4px 0;">${productName} ×${quantity}</p>
        <p style="color:#0B1F4D;font-size:20px;font-weight:900;margin:8px 0 0;">₹${totalAmount.toFixed(2)}</p>
      </div>
      <p style="color:#64748b;font-size:13px;">Track your order at <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/track" style="color:#C41E2C;font-weight:600;">printverse.in/track</a> using ID <strong style="letter-spacing:.05em;">${trackingId}</strong></p>
    </div>
    <div style="background:#f8f9fb;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">© ${new Date().getFullYear()} PrintVerse Technologies · IIFR Lab, IEM Kolkata</p>
    </div>
  </div>
</body></html>`;
}

function adminNotificationHtml({
  customer_name, email, phone, trackingId, productName, quantity, totalAmount, orderId, manualPayment,
}: {
  customer_name: string; email: string; phone: string; trackingId: string;
  productName: string; quantity: number; totalAmount: number;
  orderId: string; manualPayment: boolean;
}) {
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/orders/${orderId}`;
  return `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;padding:24px;background:#f8f9fb;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <h2 style="color:#0B1F4D;margin:0 0 16px;">🛒 New Purchase Order</h2>
    <p style="margin:4px 0;"><strong>Tracking:</strong> ${trackingId}</p>
    <p style="margin:4px 0;"><strong>Customer:</strong> ${customer_name}</p>
    <p style="margin:4px 0;"><strong>Email:</strong> ${email}</p>
    <p style="margin:4px 0;"><strong>Phone:</strong> ${phone}</p>
    <p style="margin:4px 0;"><strong>Product:</strong> ${productName} ×${quantity}</p>
    <p style="margin:4px 0;"><strong>Total:</strong> ₹${totalAmount.toFixed(2)}</p>
    ${manualPayment
      ? `<div style="margin:16px 0;padding:12px;background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;">
           <strong style="color:#92400e;">⚠ Manual Payment Required</strong>
           <p style="color:#78350f;font-size:13px;margin:6px 0 0;">
             Razorpay is not yet configured. Generate the payment link manually from the admin dashboard after Razorpay merchant approval.
           </p>
         </div>`
      : `<div style="margin:16px 0;padding:12px;background:#d1fae5;border:1px solid #6ee7b7;border-radius:8px;">
           <strong style="color:#065f46;">✓ Payment Link Generated</strong>
           <p style="color:#047857;font-size:13px;margin:4px 0 0;">Link has been sent to the customer.</p>
         </div>`
    }
    <a href="${adminUrl}" style="display:inline-block;margin-top:12px;background:#0B1F4D;color:#D4A017;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none;">
      Open in Admin →
    </a>
  </div>
</body></html>`;
}
