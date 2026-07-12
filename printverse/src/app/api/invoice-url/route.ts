import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/invoice-url?tracking_id=XXXXXX
 * Returns a short-lived signed URL for the invoice PDF,
 * but ONLY if invoice_released = true on that order.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingId = searchParams.get("tracking_id")?.trim();

  if (!trackingId || !/^\d{6}$/.test(trackingId)) {
    return NextResponse.json({ error: "Invalid tracking ID" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Check order exists AND invoice is released
  const { data: order, error } = await serviceClient
    .from("orders")
    .select("invoice_released, invoice_url")
    .eq("tracking_id", trackingId)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (!order.invoice_released || !order.invoice_url) {
    // Return 404 — don't reveal whether the order exists without a released invoice
    return NextResponse.json({ error: "Invoice not available" }, { status: 404 });
  }

  // Generate a 1-hour signed URL
  const { data: signedData, error: signError } = await serviceClient.storage
    .from("invoices")
    .createSignedUrl(order.invoice_url, 3600);

  if (signError || !signedData?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: signedData.signedUrl });
}
