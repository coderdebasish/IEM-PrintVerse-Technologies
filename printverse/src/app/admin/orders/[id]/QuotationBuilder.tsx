"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  FileText,
  Edit3,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  Send,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  createQuotation,
  updateQuotation,
  manualConvertToInvoice,
  type QuotationFormData,
} from "./actions";
import type { Order, Quotation, QuotationItem, DiscountType } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}
function plusSevenISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}
function formatINR(n: number) {
  return `₹${n.toFixed(2)}`;
}
function emptyItem(): QuotationItem {
  return { description: "", qty: 1, rate: 0, amount: 0 };
}
function calcItem(item: QuotationItem): QuotationItem {
  return { ...item, amount: item.qty * item.rate };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-[#0B1F4D] uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 focus:border-[#0B1F4D]/40 bg-white transition-all"
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface QuotationBuilderProps {
  order: Order;
  initialQuotation: Quotation | null;
}

export function QuotationBuilder({
  order,
  initialQuotation,
}: QuotationBuilderProps) {
  const [quotation, setQuotation] = useState<Quotation | null>(initialQuotation);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!initialQuotation);
  const [loading, setLoading] = useState(false);
  const [fetchingPdf, setFetchingPdf] = useState(false);

  // ── Form state ─────────────────────────────────────────────────────────
  const [customerName, setCustomerName] = useState(order.customer_name);
  const [customerEmail, setCustomerEmail] = useState(order.email);
  const [customerPhone, setCustomerPhone] = useState(order.phone);
  const [customerAddress, setCustomerAddress] = useState(
    [order.delivery_address_line, order.delivery_city, order.delivery_state]
      .filter(Boolean)
      .join(", ")
  );
  const [issueDate, setIssueDate] = useState(todayISO());
  const [validUntil, setValidUntil] = useState(plusSevenISO());
  const [items, setItems] = useState<QuotationItem[]>([emptyItem()]);
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [convertingToInvoice, setConvertingToInvoice] = useState(false);
  const [notes, setNotes] = useState(
    "1. All prices are inclusive of material and printing charges only. Delivery charges are billed separately.\n2. This quotation is valid until the date mentioned above. After expiry, prices may be revised.\n3. Orders are confirmed only after receipt of full payment.\n4. Customisation changes after order confirmation may attract additional charges.\n5. PrintVerse Technologies is not liable for design errors submitted by the customer."
  );

  // Populate form when editing existing quotation
  const populateFromQuotation = useCallback((q: Quotation) => {
    setCustomerName(q.customer_name);
    setCustomerEmail(q.customer_email);
    setCustomerPhone(q.customer_phone);
    setCustomerAddress(q.customer_address ?? "");
    setIssueDate(q.issue_date.split("T")[0]);
    setValidUntil(q.valid_until?.split("T")[0] ?? plusSevenISO());
    setItems(q.items.length > 0 ? q.items : [emptyItem()]);
    setDiscountType(q.discount_type);
    setDiscountValue(q.discount_value);
    setNotes(q.notes ?? "");
  }, []);

  useEffect(() => {
    if (initialQuotation) populateFromQuotation(initialQuotation);
  }, [initialQuotation, populateFromQuotation]);

  // ── Derived totals ─────────────────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const discountAmount =
    discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountType === "fixed"
      ? Math.min(discountValue, subtotal)
      : 0;
  const total = subtotal - discountAmount;

  // ── Item CRUD ──────────────────────────────────────────────────────────
  const updateItem = (idx: number, patch: Partial<QuotationItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? calcItem({ ...item, ...patch }) : item))
    );
  };
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (items.some((i) => !i.description.trim()))
      return toast.error("All item descriptions are required.");
    if (items.some((i) => i.rate <= 0))
      return toast.error("All item rates must be greater than 0.");

    const formData: QuotationFormData = {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      issue_date: issueDate,
      valid_until: validUntil,
      items,
      discount_type: discountType,
      discount_value: discountValue,
      notes,
    };

    setLoading(true);
    try {
      let res;
      if (quotation && isEditing) {
        res = await updateQuotation(quotation.id, order.id, formData);
      } else {
        res = await createQuotation(order.id, formData);
      }

      if (res.success && res.quotation) {
        setQuotation(res.quotation);
        setIsEditing(false);
        setIsExpanded(false);
        toast.success(
          isEditing
            ? "Quotation updated and PDF regenerated."
            : "Quotation created and PDF generated."
        );
      } else {
        toast.error(res.error ?? "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── View PDF ───────────────────────────────────────────────────────────
  const handleViewPdf = async (type: "quotation" | "invoice") => {
    setFetchingPdf(true);
    try {
      const res = await fetch(
        `/api/quotation-url?tracking_id=${order.tracking_id}&type=${type}`
      );
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("Could not fetch PDF link.");
      }
    } finally {
      setFetchingPdf(false);
    }
  };

  const isLocked = quotation?.doc_type === "invoice";
  const isCreatingNew = !quotation;
  const showForm = isCreatingNew || isEditing;

  // ── Determine section label ────────────────────────────────────────────
  const sectionTitle = isLocked
    ? "Invoice"
    : quotation
    ? "Quotation"
    : "Create Quotation";

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      {/* ── Card header ──────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0] cursor-pointer select-none"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={[
              "p-1.5 rounded-lg",
              isLocked ? "bg-emerald-100" : "bg-[#0B1F4D]/10",
            ].join(" ")}
          >
            <FileText
              className={[
                "h-4 w-4",
                isLocked ? "text-emerald-700" : "text-[#0B1F4D]",
              ].join(" ")}
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1F4D] uppercase tracking-wider">
              {sectionTitle}
            </h3>
            {quotation && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isLocked
                  ? `INV-${quotation.tracking_id}`
                  : `QT-${quotation.tracking_id}`}{" "}
                · {formatINR(quotation.total)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status pill */}
          {quotation && (
            <span
              className={[
                "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                isLocked
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700",
              ].join(" ")}
            >
              {isLocked ? "Invoice" : "Due"}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* ── Collapsed: action buttons ─────────────────────────────────── */}
      {!isExpanded && quotation && (
        <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-[#e2e8f0]">
          {quotation.quotation_pdf_path && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewPdf("quotation")}
              loading={fetchingPdf}
              icon={<Eye className="h-3.5 w-3.5" />}
              id="view-quotation-pdf-btn"
            >
              View Quotation
            </Button>
          )}
          {isLocked && quotation.invoice_pdf_path && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleViewPdf("invoice")}
              loading={fetchingPdf}
              icon={<Eye className="h-3.5 w-3.5" />}
              id="view-invoice-pdf-btn"
            >
              View Invoice
            </Button>
          )}
          {!isLocked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                populateFromQuotation(quotation);
                setIsEditing(true);
                setIsExpanded(true);
              }}
              icon={<Edit3 className="h-3.5 w-3.5" />}
              id="edit-quotation-btn"
            >
              Edit
            </Button>
          )}
          {/* ── Convert to Invoice button ──────────────────────────── */}
          {!isLocked && (
            <Button
              variant="primary"
              size="sm"
              loading={convertingToInvoice}
              icon={<Receipt className="h-3.5 w-3.5" />}
              id="convert-to-invoice-btn"
              onClick={async () => {
                if (!confirm("Convert this quotation to a final invoice? This cannot be undone.")) return;
                setConvertingToInvoice(true);
                try {
                  const res = await manualConvertToInvoice(order.id);
                  if (res.success && res.quotation) {
                    setQuotation(res.quotation);
                    toast.success("Quotation converted to Invoice successfully.");
                  } else {
                    toast.error(res.error ?? "Conversion failed.");
                  }
                } finally {
                  setConvertingToInvoice(false);
                }
              }}
            >
              Convert to Invoice
            </Button>
          )}
        </div>
      )}

      {/* ── Expanded: form builder ────────────────────────────────────── */}
      {isExpanded && (
        <div className="px-5 py-5 space-y-6">

          {/* Locked invoice notice */}
          {isLocked && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="p-1.5 rounded-lg bg-emerald-100">
                <FileText className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">
                  Invoice is locked
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Payment received. Invoice has been generated and emailed to the
                  customer.
                </p>
              </div>
            </div>
          )}

          {/* PDF actions when viewing locked invoice */}
          {isLocked && (
            <div className="flex gap-2 flex-wrap">
              {quotation?.quotation_pdf_path && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewPdf("quotation")}
                  loading={fetchingPdf}
                  icon={<Eye className="h-3.5 w-3.5" />}
                  id="view-quotation-expanded-btn"
                >
                  View Original Quotation
                </Button>
              )}
              {quotation?.invoice_pdf_path && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleViewPdf("invoice")}
                  loading={fetchingPdf}
                  icon={<Eye className="h-3.5 w-3.5" />}
                  id="view-invoice-expanded-btn"
                >
                  View Invoice PDF
                </Button>
              )}
            </div>
          )}

          {/* ── Editable form (hidden when locked) ─────────────────── */}
          {!isLocked && showForm && (
            <>
              {/* ── Section: Customer Info ─────────────────────────── */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Customer Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldRow label="Name">
                    <TextInput
                      value={customerName}
                      onChange={setCustomerName}
                      placeholder="Customer full name"
                      required
                    />
                  </FieldRow>
                  <FieldRow label="Email">
                    <TextInput
                      type="email"
                      value={customerEmail}
                      onChange={setCustomerEmail}
                      placeholder="customer@email.com"
                    />
                  </FieldRow>
                  <FieldRow label="Phone">
                    <TextInput
                      value={customerPhone}
                      onChange={setCustomerPhone}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </FieldRow>
                  <FieldRow label="Address (optional)">
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Full delivery address..."
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 resize-none"
                    />
                  </FieldRow>
                </div>
              </div>

              {/* ── Section: Dates ─────────────────────────────────── */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Document Dates
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FieldRow label="Issue Date">
                    <TextInput
                      type="date"
                      value={issueDate}
                      onChange={setIssueDate}
                    />
                  </FieldRow>
                  <FieldRow label="Valid Until">
                    <TextInput
                      type="date"
                      value={validUntil}
                      onChange={setValidUntil}
                    />
                  </FieldRow>
                </div>
              </div>

              {/* ── Section: Line Items ────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Line Items / Particulars
                  </p>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F4D] px-3 py-1.5 rounded-lg border border-[#0B1F4D]/20 hover:bg-[#0B1F4D]/5 transition-colors"
                    id="add-item-btn"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Item
                  </button>
                </div>

                {/* Column headers */}
                <div className="hidden sm:grid grid-cols-[1fr_70px_110px_110px_36px] gap-2 mb-1.5 px-1">
                  {["Description / Particulars", "Qty", "Rate (₹)", "Amount", ""].map((h) => (
                    <p key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      {h}
                    </p>
                  ))}
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_70px_110px_110px_36px] gap-2 items-center p-2 bg-[#f8f9fb] rounded-xl border border-[#e2e8f0]"
                    >
                      <input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(idx, { description: e.target.value })
                        }
                        placeholder="e.g. PLA Print – Custom Vase"
                        className="px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 bg-white w-full"
                      />
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(idx, { qty: parseInt(e.target.value) || 1 })
                        }
                        className="px-2 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#0B1F4D] text-center focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 bg-white w-full"
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(idx, {
                            rate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="px-2 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#0B1F4D] text-right focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 bg-white w-full"
                      />
                      {/* Auto-calculated amount */}
                      <div className="px-2 py-2 rounded-lg bg-[#0B1F4D]/5 border border-[#0B1F4D]/10 text-sm font-semibold text-[#0B1F4D] text-right">
                        ₹{(item.qty * item.rate).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Live totals + Discount side-by-side on desktop ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ── Section: Discount ──────────────────────────────── */}
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    Discount
                  </p>
                  <div className="flex gap-3 items-center">
                    <select
                      value={discountType}
                      onChange={(e) => {
                        setDiscountType(e.target.value as DiscountType);
                        setDiscountValue(0);
                      }}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 bg-white"
                      id="discount-type-select"
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                    {discountType !== "none" && (
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={discountValue}
                        onChange={(e) =>
                          setDiscountValue(parseFloat(e.target.value) || 0)
                        }
                        placeholder={
                          discountType === "percentage" ? "e.g. 10" : "e.g. 50"
                        }
                        className="w-32 px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] text-right focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 bg-white"
                        id="discount-value-input"
                      />
                    )}
                  </div>
                </div>

                {/* ── Live totals preview ──────────────────────────── */}
                <div className="bg-[#f8f9fb] rounded-xl border border-[#e2e8f0] p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-[#0B1F4D]">
                      {formatINR(subtotal)}
                    </span>
                  </div>
                  {discountType !== "none" && discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        Discount
                        {discountType === "percentage"
                          ? ` (${discountValue}%)`
                          : ""}
                      </span>
                      <span className="font-semibold text-[#C41E2C]">
                        - {formatINR(discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#e2e8f0] pt-2 mt-2">
                    <span className="font-bold text-[#0B1F4D]">Total Payable</span>
                    <span className="font-black text-[#0B1F4D] text-base">
                      {formatINR(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Notes / Terms ──────────────────────────────────── */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Notes & Terms
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Payment instructions, terms, disclaimers..."
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]/20 resize-none"
                  id="quotation-notes-input"
                />
              </div>

              {/* ── Action buttons ─────────────────────────────────── */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={items.length === 0}
                  variant="primary"
                  size="md"
                  icon={
                    loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )
                  }
                  id={quotation && isEditing ? "update-quotation-btn" : "generate-quotation-btn"}
                  className="flex-1"
                >
                  {quotation && isEditing
                    ? "Update & Regenerate PDF"
                    : "Generate Quotation PDF"}
                </Button>
                {quotation && isEditing && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setIsEditing(false);
                      setIsExpanded(false);
                    }}
                    id="cancel-edit-btn"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
