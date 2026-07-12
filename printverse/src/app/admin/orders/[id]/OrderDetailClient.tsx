"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Copy, ExternalLink, CheckCircle2, Phone,
  FileText, XCircle, DollarSign, Download,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge, OrderTypeBadge } from "@/components/ui/Badge";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { Button } from "@/components/ui/Button";
import { formatDate, formatPrice } from "@/lib/utils/helpers";
import {
  updateOrderStatus, setQuotedPrice, generatePaymentLink,
  markConfirmedViaCall, cancelOrder, releaseInvoice,
} from "./actions";
import type { Order, OrderStatus } from "@/types";

const ALL_STATUSES: OrderStatus[] = [
  "Requested","Contacted","Quoted","Payment Pending","Payment Received",
  "Paid","Confirmed","Printing","Invoice Sent","Shipped","Completed","Cancelled",
];

type OrderWithProduct = Order & {
  products: { id: string; name: string; price: number; image_url: string | null } | null;
};

export function OrderDetailClient({ order: initialOrder }: { order: OrderWithProduct }) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState<string | null>(null);

  // Local status update helper
  const applyUpdate = (patch: Partial<Order>) =>
    setOrder((prev) => ({ ...prev, ...patch }));

  const run = async (key: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setLoading(key);
    try {
      const res = await fn();
      if (res.success) {
        toast.success("Updated successfully.");
      } else {
        toast.error(res.error ?? "Something went wrong.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(null);
    }
  };

  // ── Status update ────────────────────────────────────────────────────────
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const handleStatusUpdate = () =>
    run("status", async () => {
      const res = await updateOrderStatus(order.id, selectedStatus);
      if (res.success) applyUpdate({ status: selectedStatus });
      return res;
    });

  // ── Quoted price ─────────────────────────────────────────────────────────
  const [priceInput, setPriceInput] = useState(
    order.quoted_price?.toString() ?? ""
  );
  const handleSetPrice = () =>
    run("price", async () => {
      const val = parseFloat(priceInput);
      const res = await setQuotedPrice(order.id, val);
      if (res.success) applyUpdate({ quoted_price: val });
      return res;
    });

  // ── Payment link ─────────────────────────────────────────────────────────
  const handleGenLink = () =>
    run("link", async () => {
      const res = await generatePaymentLink(order.id);
      if (res.success && res.paymentLink) {
        applyUpdate({ payment_link: res.paymentLink, status: "Payment Pending" });
        setSelectedStatus("Payment Pending");
      }
      return res;
    });

  // ── Confirm via call ─────────────────────────────────────────────────────
  const handleConfirmCall = () =>
    run("confirm", async () => {
      const res = await markConfirmedViaCall(order.id);
      if (res.success)
        applyUpdate({ confirmed_via_call: true, confirmed_at: new Date().toISOString(), status: "Confirmed" });
      return res;
    });

  // ── Release invoice ──────────────────────────────────────────────────────
  const handleReleaseInvoice = () =>
    run("invoice", async () => {
      const res = await releaseInvoice(order.id);
      if (res.success)
        applyUpdate({ invoice_released: true, invoice_released_at: new Date().toISOString(), status: "Invoice Sent" });
      return res;
    });

  // ── Cancellation modal ───────────────────────────────────────────────────
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const handleCancel = async () => {
    setLoading("cancel");
    const res = await cancelOrder(order.id, cancelReason);
    setLoading(null);
    if (res.success) {
      applyUpdate({ status: "Cancelled", cancellation_reason: cancelReason });
      setShowCancelModal(false);
      toast.success("Order cancelled and customer notified.");
    } else {
      toast.error(res.error ?? "Failed to cancel.");
    }
  };

  const isQuote = order.order_type === "quote";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/dashboard" className="mt-1 p-2 rounded-xl border border-[#e2e8f0] hover:bg-[#f8f9fb] transition-colors">
          <ArrowLeft className="h-4 w-4 text-[#0B1F4D]" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-[#0B1F4D] tracking-widest">
              #{order.tracking_id}
            </h1>
            <StatusBadge status={order.status} />
            <OrderTypeBadge type={order.order_type} />
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Placed {formatDate(order.created_at)}
          </p>
        </div>
        {order.status !== "Cancelled" && order.status !== "Completed" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCancelModal(true)}
            className="text-red-500 hover:bg-red-50 border border-red-200"
            icon={<XCircle className="h-4 w-4" />}
            id="cancel-order-btn"
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info */}
          <Card title="Customer Information">
            <InfoRow label="Name" value={order.customer_name} />
            <InfoRow label="Email" value={order.email} />
            <InfoRow label="Phone" value={order.phone} />
            {order.message && <InfoRow label="Message" value={order.message} multiline />}
          </Card>

          {/* Quote-specific */}
          {isQuote && (
            <>
              {order.print_preferences && (
                <Card title="Print Preferences">
                  {Object.entries(order.print_preferences as Record<string, unknown>).map(([k, v]) => (
                    <InfoRow key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={String(v)} />
                  ))}
                </Card>
              )}
              {order.stl_file_url && (
                <Card title="STL File">
                  <STLDownloadButton filePath={order.stl_file_url} />
                </Card>
              )}
            </>
          )}

          {/* Purchase-specific */}
          {!isQuote && order.products && (
            <Card title="Order Summary">
              <div className="flex gap-4 items-start">
                {order.products.image_url && (
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0 bg-[#f8f9fb]">
                    <Image src={order.products.image_url} alt={order.products.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-[#0B1F4D]">{order.products.name}</p>
                  <p className="text-slate-500 text-sm mt-0.5">Qty: {order.quantity}</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{formatPrice(order.subtotal ?? 0)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className="font-semibold">{formatPrice(order.delivery_charge)}</span></div>
                    <div className="flex justify-between border-t border-[#e2e8f0] pt-1 mt-1"><span className="font-bold text-[#0B1F4D]">Total</span><span className="font-black text-[#0B1F4D] text-base">{formatPrice(order.total_amount ?? 0)}</span></div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Purchase delivery */}
          {!isQuote && order.delivery_address_line && (
            <Card title="Delivery Address">
              <p className="text-sm text-[#0B1F4D] leading-relaxed">
                {order.delivery_address_line}<br />
                {order.delivery_city}, {order.delivery_state} — {order.delivery_pincode}
              </p>
            </Card>
          )}

          {/* Status timeline */}
          <Card title="Order Progress">
            <StatusTimeline status={order.status} orderType={order.order_type} />
          </Card>
        </div>

        {/* Right column: actions */}
        <div className="space-y-5">
          {/* Status update */}
          <Card title="Update Status">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
              id="admin-status-select"
              className="w-full px-3 py-2 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#C41E2C]/30 bg-white mb-3"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Button
              onClick={handleStatusUpdate}
              loading={loading === "status"}
              disabled={selectedStatus === order.status}
              variant="primary"
              size="sm"
              className="w-full"
              id="update-status-btn"
            >
              Update Status
            </Button>
          </Card>

          {/* Quote: set price + payment link */}
          {isQuote && (
            <Card title="Quoted Price">
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="₹ amount"
                  id="quoted-price-input"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#C41E2C]/30"
                />
                <Button onClick={handleSetPrice} loading={loading === "price"} variant="primary" size="sm" id="save-price-btn">
                  Save
                </Button>
              </div>
              {order.quoted_price && (
                <p className="text-xs text-green-700 font-semibold mb-3">
                  Current: {formatPrice(order.quoted_price)}
                </p>
              )}
              <Button
                onClick={handleGenLink}
                loading={loading === "link"}
                disabled={!order.quoted_price}
                variant="accent"
                size="sm"
                className="w-full"
                icon={<DollarSign className="h-4 w-4" />}
                id="generate-payment-link-btn"
              >
                Generate Payment Link
              </Button>
            </Card>
          )}

          {/* Payment link display */}
          {order.payment_link && (
            <Card title="Payment Link">
              <div className="flex gap-2">
                <a
                  href={order.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="payment-link-open"
                  className="flex-1 text-xs text-[#C41E2C] truncate hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  {order.payment_link}
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(order.payment_link!); toast.success("Copied!"); }}
                  className="p-1 rounded-lg hover:bg-[#f8f9fb] text-slate-400 hover:text-[#0B1F4D]"
                  id="copy-payment-link-btn"
                  aria-label="Copy payment link"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {order.paid_at && (
                <p className="text-xs text-green-700 font-semibold mt-2">
                  ✓ Paid at {formatDate(order.paid_at)}
                </p>
              )}
            </Card>
          )}

          {/* Purchase: confirm via call + invoice */}
          {!isQuote && (
            <>
              <Card title="Confirmation">
                {order.confirmed_via_call ? (
                  <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    Confirmed via call
                    {order.confirmed_at && (
                      <span className="text-xs text-slate-400 font-normal ml-1">
                        {formatDate(order.confirmed_at)}
                      </span>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleConfirmCall}
                    loading={loading === "confirm"}
                    disabled={order.status !== "Payment Received"}
                    variant="primary"
                    size="sm"
                    className="w-full"
                    icon={<Phone className="h-4 w-4" />}
                    id="mark-confirmed-btn"
                  >
                    Mark Confirmed via Call
                  </Button>
                )}
                {!order.confirmed_via_call && order.status !== "Payment Received" && (
                  <p className="text-xs text-slate-400 mt-2">
                    Available after payment is received.
                  </p>
                )}
              </Card>

              <Card title="Invoice">
                {order.invoice_released ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                      <FileText className="h-4 w-4" />
                      Invoice released
                    </div>
                    <p className="text-xs text-slate-400">{order.invoice_released_at && formatDate(order.invoice_released_at)}</p>
                  </div>
                ) : (
                  <Button
                    onClick={handleReleaseInvoice}
                    loading={loading === "invoice"}
                    disabled={!order.confirmed_via_call}
                    variant="gold"
                    size="sm"
                    className="w-full"
                    icon={<FileText className="h-4 w-4" />}
                    id="release-invoice-btn"
                  >
                    Release Invoice
                  </Button>
                )}
                {!order.confirmed_via_call && (
                  <p className="text-xs text-[#C41E2C] font-semibold mt-2">
                    ⚠ Must confirm via call first
                  </p>
                )}
              </Card>
            </>
          )}

          {/* Cancellation info */}
          {order.status === "Cancelled" && order.cancellation_reason && (
            <Card title="Cancellation Reason">
              <p className="text-sm text-red-700 leading-relaxed">{order.cancellation_reason}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-lg font-black text-[#0B1F4D] mb-2">Cancel Order</h2>
            <p className="text-sm text-slate-500 mb-4">
              This will email the customer. Provide a clear reason.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation before printing started."
              rows={4}
              id="cancel-reason-textarea"
              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Minimum 10 characters. ({cancelReason.length}/500)
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handleCancel}
                loading={loading === "cancel"}
                disabled={cancelReason.trim().length < 10}
                className="flex-1"
                id="confirm-cancel-btn"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5"
      style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="text-sm font-bold text-[#0B1F4D] uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex gap-3 py-2 border-b border-[#f1f5f9] last:border-0">
      <span className="text-xs text-slate-400 w-24 shrink-0 pt-0.5">{label}</span>
      <span className={["text-sm text-[#0B1F4D] font-medium flex-1", multiline ? "whitespace-pre-wrap" : ""].join(" ")}>
        {value}
      </span>
    </div>
  );
}

function STLDownloadButton({ filePath }: { filePath: string }) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stl-url?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
      else toast.error("Could not fetch STL download link.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button onClick={handleDownload} loading={loading} variant="outline" size="sm"
      icon={<Download className="h-4 w-4" />} id="stl-download-btn">
      Download STL File
    </Button>
  );
}
