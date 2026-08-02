import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/quotation-url?tracking_id=XXXXXX&type=quotation|invoice
 *
 * Returns a 1-hour signed URL for either:
 *  - the quotation PDF (type=quotation) — always accessible if it exists
 *  - the invoice PDF (type=invoice) — only if doc_type = 'invoice'
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingId = searchParams.get("tracking_id")?.trim();
  const type = searchParams.get("type"); // "quotation" | "invoice"

  if (!trackingId || !/^\d{6}$/.test(trackingId)) {
    return NextResponse.json({ error: "Invalid tracking ID" }, { status: 400 });
  }

  if (type !== "quotation" && type !== "invoice") {
    return NextResponse.json(
      { error: "type must be 'quotation' or 'invoice'" },
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient();

  // Find the quotation by tracking_id
  const { data: quotation, error } = await serviceClient
    .from("quotations")
    .select("quotation_pdf_path, invoice_pdf_path, doc_type")
    .eq("tracking_id", trackingId)
    .maybeSingle();

  if (error || !quotation) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  // Determine which path to use
  let filePath: string | null = null;

  if (type === "quotation") {
    filePath = quotation.quotation_pdf_path;
  } else {
    // Invoice only accessible once converted
    if (quotation.doc_type !== "invoice") {
      return NextResponse.json(
        { error: "Invoice not yet generated" },
        { status: 404 }
      );
    }
    filePath = quotation.invoice_pdf_path;
  }

  if (!filePath) {
    return NextResponse.json(
      { error: "PDF not yet generated" },
      { status: 404 }
    );
  }

  // Generate 1-hour signed URL
  const { data: signedData, error: signError } = await serviceClient.storage
    .from("invoices")
    .createSignedUrl(filePath, 3600);

  if (signError || !signedData?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: signedData.signedUrl });
}
