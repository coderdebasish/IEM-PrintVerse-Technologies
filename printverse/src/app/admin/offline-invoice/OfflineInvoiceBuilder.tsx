"use client";

import { useState } from "react";
import {
  Plus, Trash2, Send, Loader2, Eye, Receipt, FileText,
  IndianRupee, User, Calendar, AlignLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { SecurityPinModal } from "@/components/admin/SecurityPinModal";
import {
  createOfflineDocument,
  convertOfflineToInvoice,
  getOfflineDocUrl,
  deleteOfflineDocument,
  type OfflineDocFormData,
} from "./actions";
import type { OfflineInvoice, QuotationItem, DiscountType, DocType } from "@/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().split("T")[0]; }
function plusSevenISO() {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}
function formatINR(n: number) { return `₹${n.toFixed(2)}`; }
function emptyItem(): QuotationItem { return { description: "", qty: 1, rate: 0, amount: 0 }; }
function calcItem(i: QuotationItem): QuotationItem { return { ...i, amount: i.qty * i.rate }; }

const DEFAULT_NOTES =
  "1. All prices are inclusive of material and printing charges only.\n" +
  "2. Delivery charges are billed separately.\n" +
  "3. Orders confirmed only after receipt of full payment.\n" +
  "4. PrintVerse Technologies is not liable for design errors submitted by the customer.";

// ── sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-[#0B1F4D] uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] " +
  "focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 focus:border-[#0B1F4D]/40 bg-white transition-all";

// ── main component ────────────────────────────────────────────────────────────

interface Props {
  initialDocs: OfflineInvoice[];
}

export function OfflineInvoiceBuilder({ initialDocs }: Props) {
  const [docs, setDocs] = useState<OfflineInvoice[]>(initialDocs);
  const [loading, setLoading] = useState(false);
  const [fetchingPdf, setFetchingPdf] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<OfflineInvoice | null>(null);

  // ── delete document ────────────────────────────────────────────────────────
  const handleDeleteConfirm = async (pin: string) => {
    if (!docToDelete) return { success: false, error: "No document selected." };
    const res = await deleteOfflineDocument(docToDelete.id, pin);
    if (res.success) {
      setDocs((prev) => prev.filter((d) => d.id !== docToDelete.id));
      toast.success(`Document ${docToDelete.quotation_number} permanently deleted.`);
      return { success: true };
    }
    return res;
  };

  // ── form state ─────────────────────────────────────────────────────────────
  const [docType, setDocType] = useState<DocType>("quotation");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [validUntil, setValidUntil] = useState(plusSevenISO());
  const [items, setItems] = useState<QuotationItem[]>([emptyItem()]);
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [notes, setNotes] = useState(DEFAULT_NOTES);

  // ── totals ─────────────────────────────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const discountAmount =
    discountType === "percentage" ? (subtotal * discountValue) / 100
    : discountType === "fixed" ? Math.min(discountValue, subtotal)
    : 0;
  const total = subtotal - discountAmount;

  // ── item CRUD ──────────────────────────────────────────────────────────────
  const updateItem = (idx: number, patch: Partial<QuotationItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? calcItem({ ...it, ...patch }) : it)));
  const addItem = () => setItems((p) => [...p, emptyItem()]);
  const removeItem = (idx: number) => setItems((p) => p.filter((_, i) => i !== idx));

  // ── reset form ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setDocType("quotation"); setCustomerName(""); setCustomerEmail("");
    setCustomerPhone(""); setCustomerAddress(""); setIssueDate(todayISO());
    setValidUntil(plusSevenISO()); setItems([emptyItem()]);
    setDiscountType("none"); setDiscountValue(0); setNotes(DEFAULT_NOTES);
  };

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!customerName.trim()) return toast.error("Customer name is required.");
    if (items.some((i) => !i.description.trim())) return toast.error("All item descriptions are required.");
    if (items.some((i) => i.rate <= 0)) return toast.error("All item rates must be greater than 0.");

    const formData: OfflineDocFormData = {
      doc_type: docType, customer_name: customerName.trim(),
      customer_email: customerEmail.trim(), customer_phone: customerPhone.trim(),
      customer_address: customerAddress.trim(), issue_date: issueDate,
      valid_until: docType === "invoice" ? "" : validUntil,
      items, discount_type: discountType, discount_value: discountValue, notes,
    };

    setLoading(true);
    try {
      const res = await createOfflineDocument(formData);
      if (res.success && res.doc) {
        setDocs((prev) => [res.doc!, ...prev]);
        resetForm();
        toast.success(`${docType === "invoice" ? "Invoice" : "Quotation"} generated successfully!`);
      } else {
        toast.error(res.error ?? "Failed to generate document.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── view PDF ───────────────────────────────────────────────────────────────
  const handleViewPdf = async (id: string, type: "quotation" | "invoice") => {
    setFetchingPdf(id + type);
    try {
      const res = await getOfflineDocUrl(id, type);
      if (res.success && res.url) window.open(res.url, "_blank");
      else toast.error(res.error ?? "Could not fetch PDF.");
    } finally {
      setFetchingPdf(null);
    }
  };

  // ── convert to invoice ─────────────────────────────────────────────────────
  const handleConvert = async (id: string) => {
    if (!confirm("Convert this quotation to a final invoice? This cannot be undone.")) return;
    setConverting(id);
    try {
      const res = await convertOfflineToInvoice(id);
      if (res.success && res.doc) {
        setDocs((prev) => prev.map((d) => (d.id === id ? res.doc! : d)));
        toast.success("Converted to Invoice.");
      } else {
        toast.error(res.error ?? "Conversion failed.");
      }
    } finally {
      setConverting(null);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-[#0B1F4D]">Offline Invoice Generator</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Create quotations or invoices for walk-in / offline customers — no online order needed.
        </p>
      </div>

      {/* ── Builder Form ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        
        {/* Form Header */}
        <div className="px-6 py-4 bg-[#0B1F4D] flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[#D4A017]/20 flex items-center justify-center">
            <FileText className="h-4 w-4 text-[#D4A017]" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">New Document</h2>
            <p className="text-[10px] text-slate-400">Fill in details and generate PDF</p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-7">

          {/* ── Doc type toggle ──────────────────────────────────────── */}
          <div>
            <SectionLabel>Document Type</SectionLabel>
            <div className="flex gap-3">
              {(["quotation", "invoice"] as DocType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setDocType(type)}
                  className={[
                    "flex items-center gap-2 px-5 py-3 rounded-xl border-2 text-sm font-bold transition-all",
                    docType === type
                      ? type === "invoice"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-[#0B1F4D] bg-[#0B1F4D]/5 text-[#0B1F4D]"
                      : "border-[#e2e8f0] text-slate-400 hover:border-slate-300",
                  ].join(" ")}
                  id={`doc-type-${type}`}
                >
                  {type === "invoice" ? <Receipt className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  {type === "invoice" ? "Invoice" : "Quotation"}
                </button>
              ))}
            </div>
            {docType === "invoice" && (
              <p className="mt-2 text-xs text-emerald-600 font-semibold">
                ✓ Invoice will be generated as a final locked document immediately.
              </p>
            )}
          </div>

          {/* ── Customer Details ─────────────────────────────────────── */}
          <div>
            <SectionLabel>
              <User className="inline h-3 w-3 mr-1" />Customer Details
            </SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldWrap label="Full Name *">
                <input className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" id="offline-customer-name" />
              </FieldWrap>
              <FieldWrap label="Email">
                <input type="email" className={inputCls} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@email.com" id="offline-customer-email" />
              </FieldWrap>
              <FieldWrap label="Phone">
                <input className={inputCls} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" id="offline-customer-phone" />
              </FieldWrap>
              <FieldWrap label="Address (optional)">
                <textarea className={`${inputCls} resize-none`} rows={2} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Delivery or billing address…" id="offline-customer-address" />
              </FieldWrap>
            </div>
          </div>

          {/* ── Dates ────────────────────────────────────────────────── */}
          <div>
            <SectionLabel>
              <Calendar className="inline h-3 w-3 mr-1" />Document Dates
            </SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FieldWrap label="Issue Date">
                <input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} id="offline-issue-date" />
              </FieldWrap>
              {docType === "quotation" && (
                <FieldWrap label="Valid Until">
                  <input type="date" className={inputCls} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} id="offline-valid-until" />
                </FieldWrap>
              )}
            </div>
          </div>

          {/* ── Line Items ───────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>
                <IndianRupee className="inline h-3 w-3 mr-1" />Line Items / Particulars
              </SectionLabel>
              <button onClick={addItem} id="offline-add-item-btn" className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F4D] px-3 py-1.5 rounded-lg border border-[#0B1F4D]/20 hover:bg-[#0B1F4D]/5 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>

            <div className="hidden sm:grid grid-cols-[1fr_70px_110px_110px_36px] gap-2 mb-1.5 px-1">
              {["Description / Particulars", "Qty", "Rate (₹)", "Amount", ""].map((h) => (
                <p key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</p>
              ))}
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_70px_110px_110px_36px] gap-2 items-center p-2 bg-[#f8f9fb] rounded-xl border border-[#e2e8f0]">
                  <input value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} placeholder="e.g. PLA Print – Custom Part" className="px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 bg-white w-full" />
                  <input type="number" min={1} value={item.qty} onChange={(e) => updateItem(idx, { qty: parseInt(e.target.value) || 1 })} className="px-2 py-2 rounded-lg border border-[#e2e8f0] text-sm text-center text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 bg-white w-full" />
                  <input type="number" min={0} step="0.01" value={item.rate} onChange={(e) => updateItem(idx, { rate: parseFloat(e.target.value) || 0 })} className="px-2 py-2 rounded-lg border border-[#e2e8f0] text-sm text-right text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 bg-white w-full" />
                  <div className="px-2 py-2 rounded-lg bg-[#0B1F4D]/5 border border-[#0B1F4D]/10 text-sm font-semibold text-[#0B1F4D] text-right">
                    ₹{(item.qty * item.rate).toFixed(2)}
                  </div>
                  <button onClick={() => removeItem(idx)} disabled={items.length === 1} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30" aria-label="Remove item">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Discount + Totals ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <SectionLabel>Discount</SectionLabel>
              <div className="flex gap-3 items-center">
                <select value={discountType} onChange={(e) => { setDiscountType(e.target.value as DiscountType); setDiscountValue(0); }} className={inputCls} id="offline-discount-type">
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
                {discountType !== "none" && (
                  <input type="number" min={0} step="0.01" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} className="w-32 px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm text-right text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 bg-white" id="offline-discount-value" />
                )}
              </div>
            </div>
            <div className="bg-[#f8f9fb] rounded-xl border border-[#e2e8f0] p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-[#0B1F4D]">{formatINR(subtotal)}</span>
              </div>
              {discountType !== "none" && discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Discount {discountType === "percentage" ? `(${discountValue}%)` : ""}</span>
                  <span className="font-semibold text-[#C41E2C]">- {formatINR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#e2e8f0] pt-2 mt-2">
                <span className="font-bold text-[#0B1F4D]">{docType === "invoice" ? "Total Paid" : "Total Payable"}</span>
                <span className="font-black text-[#0B1F4D] text-base">{formatINR(total)}</span>
              </div>
            </div>
          </div>

          {/* ── Notes ────────────────────────────────────────────────── */}
          <div>
            <SectionLabel>
              <AlignLeft className="inline h-3 w-3 mr-1" />Notes &amp; Terms
            </SectionLabel>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={`${inputCls} resize-none`} placeholder="Payment terms, special conditions…" id="offline-notes" />
          </div>

          {/* ── Generate button ───────────────────────────────────────── */}
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={items.length === 0}
            variant="primary"
            size="md"
            id="offline-generate-btn"
            icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          >
            Generate {docType === "invoice" ? "Invoice" : "Quotation"} PDF
          </Button>
        </div>
      </div>

      {/* ── Documents list ────────────────────────────────────────────── */}
      {docs.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-6 py-4 border-b border-[#e2e8f0]">
            <h2 className="text-sm font-black text-[#0B1F4D] uppercase tracking-wider">
              Offline Documents ({docs.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8f9fb]">
                <tr>
                  {["Doc #", "Type", "Customer", "Total", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {docs.map((doc) => {
                  const isInvoice = doc.doc_type === "invoice";
                  return (
                    <tr key={doc.id} className="hover:bg-[#f8f9fb] transition-colors">
                      <td className="px-5 py-3 font-black text-[#0B1F4D] tracking-wider whitespace-nowrap">
                        {doc.quotation_number}
                      </td>
                      <td className="px-5 py-3">
                        <span className={["text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider", isInvoice ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"].join(" ")}>
                          {isInvoice ? "Invoice" : "Quotation"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-[#0B1F4D]">{doc.customer_name}</p>
                        <p className="text-xs text-slate-400">{doc.customer_phone}</p>
                      </td>
                      <td className="px-5 py-3 font-black text-[#0B1F4D]">
                        ₹{doc.total.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(doc.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {doc.quotation_pdf_path && (
                            <button
                              onClick={() => handleViewPdf(doc.id, "quotation")}
                              disabled={fetchingPdf === doc.id + "quotation"}
                              id={`view-offline-qt-${doc.id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] text-xs font-bold text-slate-600 hover:bg-[#f8f9fb] transition-colors disabled:opacity-50"
                            >
                              <Eye className="h-3 w-3" />
                              {isInvoice ? "Orig. QT" : "View PDF"}
                            </button>
                          )}
                          {isInvoice && doc.invoice_pdf_path && (
                            <button
                              onClick={() => handleViewPdf(doc.id, "invoice")}
                              disabled={fetchingPdf === doc.id + "invoice"}
                              id={`view-offline-inv-${doc.id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              <Eye className="h-3 w-3" /> Invoice PDF
                            </button>
                          )}
                          {!isInvoice && (
                            <button
                              onClick={() => handleConvert(doc.id)}
                              disabled={converting === doc.id}
                              id={`convert-offline-${doc.id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0B1F4D] text-xs font-bold text-[#D4A017] hover:bg-[#1a3a7a] transition-colors disabled:opacity-50"
                            >
                              {converting === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Receipt className="h-3 w-3" />}
                              To Invoice
                            </button>
                          )}
                          <button
                            onClick={() => setDocToDelete(doc)}
                            id={`delete-offline-${doc.id}`}
                            title="Delete Document"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security PIN Delete Modal */}
      <SecurityPinModal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Offline Document"
        itemIdentifier={`Document ${docToDelete?.quotation_number} (${docToDelete?.customer_name})`}
        description="This will permanently delete this offline quotation/invoice record from the database."
      />
    </div>
  );
}
