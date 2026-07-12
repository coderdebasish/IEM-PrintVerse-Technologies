"use client";

import { useState, useCallback } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import {
  Search,
  Hash,
  Phone,
  Download,
  Package,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { isValidPhoneNumber } from "libphonenumber-js";
import { createClient } from "@/lib/supabase/client";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { StatusBadge, OrderTypeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormFields";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatPrice } from "@/lib/utils/helpers";
import type { Order } from "@/types";

type Tab = "tracking-id" | "phone-email";

// Minimal order summary for phone+email lookup results
interface MinimalOrder {
  tracking_id: string;
  order_type: string;
  status: string;
  created_at: string;
}

// ── Invoice download helper ────────────────────────────────────────────────

async function getInvoiceSignedUrl(trackingId: string): Promise<string | null> {
  const res = await fetch(`/api/invoice-url?tracking_id=${trackingId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.url ?? null;
}

// ── Order Detail View ──────────────────────────────────────────────────────

function OrderDetail({
  order,
  productName,
  onBack,
}: {
  order: Order;
  productName?: string;
  onBack?: () => void;
}) {
  const [fetchingInvoice, setFetchingInvoice] = useState(false);

  const handleDownloadInvoice = async () => {
    setFetchingInvoice(true);
    try {
      const url = await getInvoiceSignedUrl(order.tracking_id);
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error("Unable to fetch invoice. Please try again.");
      }
    } finally {
      setFetchingInvoice(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0B1F4D] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to results
        </button>
      )}

      {/* Order summary card */}
      <div
        className="bg-white rounded-2xl border border-[#e2e8f0] p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Tracking ID
            </p>
            <p className="text-3xl font-black text-[#0B1F4D] tracking-widest">
              {order.tracking_id}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            <OrderTypeBadge type={order.order_type} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm border-t border-[#e2e8f0] pt-4">
          <div>
            <p className="text-slate-400 text-xs mb-0.5">Placed on</p>
            <p className="font-semibold text-[#0B1F4D]">
              {formatDate(order.created_at)}
            </p>
          </div>
          {order.order_type === "purchase" && (
            <>
              {productName && (
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Product</p>
                  <p className="font-semibold text-[#0B1F4D]">{productName}</p>
                </div>
              )}
              {order.quantity > 1 && (
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Quantity</p>
                  <p className="font-semibold text-[#0B1F4D]">
                    {order.quantity}
                  </p>
                </div>
              )}
              {order.total_amount && (
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Total Paid</p>
                  <p className="font-bold text-[#0B1F4D]">
                    {formatPrice(order.total_amount)}
                  </p>
                </div>
              )}
              {order.delivery_city && (
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">Delivery</p>
                  <p className="font-semibold text-[#0B1F4D]">
                    {order.delivery_city}, {order.delivery_state}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Invoice download — only shown when released */}
        {order.invoice_released && (
          <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
            <Button
              onClick={handleDownloadInvoice}
              loading={fetchingInvoice}
              variant="outline"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              id="download-invoice-btn"
            >
              Download Invoice
            </Button>
          </div>
        )}

        {/* Cancellation reason */}
        {order.status === "Cancelled" && order.cancellation_reason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <strong>Cancellation reason:</strong> {order.cancellation_reason}
          </div>
        )}
      </div>

      {/* Status timeline */}
      <div
        className="bg-white rounded-2xl border border-[#e2e8f0] p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="text-base font-black text-[#0B1F4D] mb-6">
          Order Progress
        </h3>
        <StatusTimeline status={order.status} orderType={order.order_type} />
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────

export function TrackOrderClient() {
  const [activeTab, setActiveTab] = useState<Tab>("tracking-id");
  const [loading, setLoading] = useState(false);

  // Tracking ID mode
  const [trackingInput, setTrackingInput] = useState("");
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [productName, setProductName] = useState<string | undefined>();
  const [notFound, setNotFound] = useState(false);

  // Phone+email mode
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [orderList, setOrderList] = useState<MinimalOrder[]>([]);
  const [listSearched, setListSearched] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const supabase = createClient();

  // ── Search by tracking ID ──────────────────────────────────────────────

  const searchByTrackingId = useCallback(async () => {
    const id = trackingInput.trim();
    if (!id || id.length !== 6 || !/^\d{6}$/.test(id)) {
      toast.error("Please enter a valid 6-digit tracking ID.");
      return;
    }
    setLoading(true);
    setNotFound(false);
    setFoundOrder(null);
    try {
      const { data, error } = await supabase.rpc("get_order_by_tracking", {
        p_tracking_id: id,
      });
      if (error) throw error;
      if (!data || data.length === 0) {
        setNotFound(true);
      } else {
        const order = data[0] as Order;
        setFoundOrder(order);
        // Fetch product name if purchase order
        if (order.order_type === "purchase" && order.product_id) {
          const { data: prod } = await supabase
            .from("products")
            .select("name")
            .eq("id", order.product_id)
            .maybeSingle();
          setProductName(prod?.name);
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [trackingInput, supabase]);

  // ── Search by phone + email ────────────────────────────────────────────

  const searchByPhoneEmail = useCallback(async () => {
    // Validate both fields
    let valid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.trim() || !emailRegex.test(emailInput)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    } else {
      setEmailError("");
    }
    try {
      if (!isValidPhoneNumber(phoneInput)) {
        setPhoneError("Please enter a valid phone number.");
        valid = false;
      } else {
        setPhoneError("");
      }
    } catch {
      setPhoneError("Please enter a valid phone number.");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    setListSearched(false);
    setOrderList([]);
    try {
      const { data, error } = await supabase.rpc(
        "get_orders_by_phone_email",
        { p_phone: phoneInput, p_email: emailInput.trim() }
      );
      if (error) throw error;
      setOrderList((data as MinimalOrder[]) ?? []);
      setListSearched(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [phoneInput, emailInput, supabase]);

  // ── If user clicked through from phone+email list ──────────────────────

  const handleSelectOrder = useCallback(
    async (trackingId: string) => {
      setSelectedTrackId(trackingId);
      setLoading(true);
      try {
        const { data } = await supabase.rpc("get_order_by_tracking", {
          p_tracking_id: trackingId,
        });
        if (data && data.length > 0) {
          setFoundOrder(data[0] as Order);
          const order = data[0] as Order;
          if (order.order_type === "purchase" && order.product_id) {
            const { data: prod } = await supabase
              .from("products")
              .select("name")
              .eq("id", order.product_id)
              .maybeSingle();
            setProductName(prod?.name);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // ── Render ─────────────────────────────────────────────────────────────

  // Show detail view when order found (either path)
  if (foundOrder && selectedTrackId) {
    return (
      <OrderDetail
        order={foundOrder}
        productName={productName}
        onBack={() => {
          setFoundOrder(null);
          setSelectedTrackId(null);
        }}
      />
    );
  }
  if (foundOrder && activeTab === "tracking-id") {
    return (
      <OrderDetail
        order={foundOrder}
        productName={productName}
        onBack={() => { setFoundOrder(null); setNotFound(false); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div
        className="bg-white rounded-2xl border border-[#e2e8f0] p-2 flex gap-2"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {[
          { id: "tracking-id" as Tab, label: "By Tracking ID", icon: Hash },
          { id: "phone-email" as Tab, label: "By Phone & Email", icon: Phone },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            onClick={() => {
              setActiveTab(id);
              setFoundOrder(null);
              setNotFound(false);
              setListSearched(false);
              setOrderList([]);
              setSelectedTrackId(null);
            }}
            className={[
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all",
              activeTab === id
                ? "bg-[#0B1F4D] text-white shadow-sm"
                : "text-[#64748b] hover:text-[#0B1F4D] hover:bg-[#f8f9fb]",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: By Tracking ID ──────────────────────────────────────────── */}
      {activeTab === "tracking-id" && (
        <div
          className="bg-white rounded-2xl border border-[#e2e8f0] p-7"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="text-lg font-black text-[#0B1F4D] mb-1">
            Track by ID
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Enter the 6-digit tracking ID you received after submitting your request.
          </p>
          <div className="flex gap-3">
            <Input
              placeholder="e.g. 482913"
              maxLength={6}
              id="tracking-id-input"
              value={trackingInput}
              onChange={(e) => {
                setTrackingInput(e.target.value.replace(/\D/g, ""));
                setNotFound(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchByTrackingId();
              }}
              containerClassName="flex-1"
            />
            <Button
              onClick={searchByTrackingId}
              loading={loading}
              variant="primary"
              size="md"
              icon={<Search className="h-4 w-4" />}
              id="track-by-id-btn"
            >
              Search
            </Button>
          </div>

          {notFound && (
            <div className="mt-4 p-4 bg-[#f8f9fb] border border-[#e2e8f0] rounded-xl text-center animate-fade-in">
              <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0B1F4D]">
                No order found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Double-check your tracking ID and try again.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: By Phone + Email ─────────────────────────────────────────── */}
      {activeTab === "phone-email" && (
        <div
          className="bg-white rounded-2xl border border-[#e2e8f0] p-7"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="text-lg font-black text-[#0B1F4D] mb-1">
            Look Up by Phone &amp; Email
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Both must match the same order. Returns a list of your orders.
          </p>
          <div className="space-y-4">
            {/* Phone picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#0B1F4D]">
                Phone Number <span className="text-[#C41E2C]">*</span>
              </label>
              <PhoneInput
                defaultCountry="in"
                value={phoneInput}
                onChange={setPhoneInput}
                inputStyle={{
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: "0.75rem",
                  border: phoneError ? "1px solid #f87171" : "1px solid #e2e8f0",
                  fontSize: "14px",
                  color: "#0B1F4D",
                  fontFamily: "Inter, sans-serif",
                }}
                countrySelectorStyleProps={{
                  buttonStyle: {
                    border: phoneError ? "1px solid #f87171" : "1px solid #e2e8f0",
                    borderRight: "none",
                    borderRadius: "0.75rem 0 0 0.75rem",
                    padding: "0 10px",
                  },
                }}
              />
              {phoneError && (
                <p className="text-xs text-red-600 font-medium">{phoneError}</p>
              )}
            </div>

            <Input
              label="Email Address"
              type="email"
              required
              id="track-email-input"
              placeholder="you@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              error={emailError}
            />

            <Button
              onClick={searchByPhoneEmail}
              loading={loading}
              variant="primary"
              size="md"
              icon={<Search className="h-4 w-4" />}
              id="track-by-phone-email-btn"
              className="w-full"
            >
              Find My Orders
            </Button>
          </div>

          {/* Results list */}
          {listSearched && !loading && (
            <div className="mt-6 animate-fade-in">
              {orderList.length === 0 ? (
                <div className="p-6 bg-[#f8f9fb] border border-[#e2e8f0] rounded-xl text-center">
                  <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#0B1F4D]">
                    No orders found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Check your phone number and email address and try again.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    {orderList.length} order{orderList.length > 1 ? "s" : ""} found
                  </p>
                  {orderList.map((o) => (
                    <button
                      key={o.tracking_id}
                      onClick={() => handleSelectOrder(o.tracking_id)}
                      className="w-full flex items-center justify-between p-4 bg-[#f8f9fb] border border-[#e2e8f0] rounded-xl hover:border-[#0B1F4D]/30 hover:bg-white transition-all text-left group"
                    >
                      <div>
                        <p className="font-black text-[#0B1F4D] text-lg tracking-wider">
                          {o.tracking_id}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={o.status as Order["status"]} />
                          <span className="text-xs text-slate-400">
                            {formatDate(o.created_at)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-[#C41E2C] transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="mt-6 flex justify-center">
              <Spinner size="md" color="primary" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
