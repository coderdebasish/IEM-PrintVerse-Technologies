"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateDocumentPDF } from "@/lib/invoice/generateDocumentPDF";
import type { OfflineInvoice, QuotationItem, DiscountType, DocType } from "@/types";

// ─── Guard ────────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTrackingId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateUniqueOfflineId(service: ReturnType<typeof createServiceClient>): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const id = generateTrackingId();
    const { data } = await service
      .from("offline_invoices")
      .select("id")
      .eq("tracking_id", id)
      .maybeSingle();
    if (!data) return id;
  }
  throw new Error("Could not generate unique tracking ID");
}

function calcFinancials(
  items: QuotationItem[],
  discountType: DiscountType,
  discountValue: number
) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  let discountAmount = 0;
  if (discountType === "percentage") discountAmount = (subtotal * discountValue) / 100;
  else if (discountType === "fixed") discountAmount = Math.min(discountValue, subtotal);
  const total = subtotal - discountAmount;
  const itemsWithAmount = items.map((i) => ({ ...i, amount: i.qty * i.rate }));
  return { subtotal, discountAmount, total, itemsWithAmount };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfflineDocFormData {
  doc_type: DocType;
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

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createOfflineDocument(
  formData: OfflineDocFormData
): Promise<{ success: boolean; doc?: OfflineInvoice; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  const trackingId = await generateUniqueOfflineId(service);
  const prefix = formData.doc_type === "invoice" ? "INV" : "QT";
  const docNumber = `${prefix}-${trackingId}`;

  const { subtotal, discountAmount, total, itemsWithAmount } = calcFinancials(
    formData.items,
    formData.discount_type,
    formData.discount_value
  );

  const payload = {
    tracking_id: trackingId,
    doc_type: formData.doc_type,
    customer_name: formData.customer_name,
    customer_email: formData.customer_email,
    customer_phone: formData.customer_phone,
    customer_address: formData.customer_address || null,
    quotation_number: docNumber,
    issue_date: formData.issue_date,
    valid_until: formData.valid_until || null,
    items: itemsWithAmount,
    subtotal,
    discount_type: formData.discount_type,
    discount_value: formData.discount_value,
    discount_amount: discountAmount,
    total,
    notes: formData.notes || null,
    quotation_pdf_path: null as string | null,
    invoice_pdf_path: null as string | null,
  };

  const { data: inserted, error: insertErr } = await service
    .from("offline_invoices")
    .insert(payload)
    .select()
    .single();

  if (insertErr || !inserted)
    return { success: false, error: insertErr?.message ?? "Insert failed." };

  // Generate PDF — adapt the Quotation shape to match what generateDocumentPDF expects
  const pdfDoc = {
    ...inserted,
    order_id: "offline",
    quotation_number: docNumber,
  };

  const pdfBuffer = await generateDocumentPDF(pdfDoc as unknown as import("@/types").Quotation);

  const isInvoice = formData.doc_type === "invoice";
  const folder = isInvoice ? "invoices" : "quotations";
  const pdfPath = `${folder}/${docNumber}.pdf`;

  const { error: uploadErr } = await service.storage
    .from("invoices")
    .upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (uploadErr)
    return { success: false, error: "PDF upload failed: " + uploadErr.message };

  const pdfField = isInvoice
    ? { invoice_pdf_path: pdfPath }
    : { quotation_pdf_path: pdfPath };

  const { data: updated, error: updateErr } = await service
    .from("offline_invoices")
    .update(pdfField)
    .eq("id", inserted.id)
    .select()
    .single();

  if (updateErr || !updated)
    return { success: false, error: updateErr?.message ?? "Update failed." };

  revalidatePath("/admin/offline-invoice");
  return { success: true, doc: updated as OfflineInvoice };
}

// ─── Convert quotation → invoice ──────────────────────────────────────────────

export async function convertOfflineToInvoice(
  id: string
): Promise<{ success: boolean; doc?: OfflineInvoice; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  const { data: existing, error: fetchErr } = await service
    .from("offline_invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !existing)
    return { success: false, error: "Document not found." };

  const doc = existing as OfflineInvoice;
  if (doc.doc_type === "invoice")
    return { success: false, error: "Already an invoice." };

  const invoiceData = {
    ...doc,
    doc_type: "invoice" as DocType,
    quotation_number: `INV-${doc.tracking_id}`,
    issue_date: new Date().toISOString().split("T")[0],
  };

  const pdfBuffer = await generateDocumentPDF(invoiceData as unknown as import("@/types").Quotation);

  const invoicePath = `invoices/INV-${doc.tracking_id}.pdf`;
  const { error: uploadErr } = await service.storage
    .from("invoices")
    .upload(invoicePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (uploadErr)
    return { success: false, error: "PDF upload failed: " + uploadErr.message };

  const { data: updated, error: updateErr } = await service
    .from("offline_invoices")
    .update({
      doc_type: "invoice",
      quotation_number: `INV-${doc.tracking_id}`,
      invoice_pdf_path: invoicePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateErr || !updated)
    return { success: false, error: updateErr?.message ?? "Update failed." };

  revalidatePath("/admin/offline-invoice");
  return { success: true, doc: updated as OfflineInvoice };
}

// ─── Get signed PDF URL ───────────────────────────────────────────────────────

export async function getOfflineDocUrl(
  id: string,
  type: "quotation" | "invoice"
): Promise<{ success: boolean; url?: string; error?: string }> {
  await requireAdmin();
  const service = createServiceClient();

  const { data, error } = await service
    .from("offline_invoices")
    .select("quotation_pdf_path, invoice_pdf_path")
    .eq("id", id)
    .single();

  if (error || !data) return { success: false, error: "Not found." };

  const pdfPath =
    type === "invoice" ? data.invoice_pdf_path : data.quotation_pdf_path;

  if (!pdfPath) return { success: false, error: "PDF not yet generated." };

  const { data: signed, error: signErr } = await service.storage
    .from("invoices")
    .createSignedUrl(pdfPath, 3600);

  if (signErr || !signed?.signedUrl)
    return { success: false, error: "Failed to generate download link." };

  return { success: true, url: signed.signedUrl };
}

// ─── List all offline docs ────────────────────────────────────────────────────

export async function listOfflineDocuments(): Promise<OfflineInvoice[]> {
  await requireAdmin();
  const service = createServiceClient();

  const { data } = await service
    .from("offline_invoices")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []) as OfflineInvoice[];
}
