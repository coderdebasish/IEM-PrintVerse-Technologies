"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import {
  MapPin, CheckCircle2, AlertCircle, Loader2,
  ShoppingCart, ExternalLink, Copy,
} from "lucide-react";
import { toast } from "sonner";

import { checkoutFormSchema, type CheckoutFormData } from "@/lib/validations/schemas";
import { validatePincode } from "@/lib/utils/pincode";
import { formatPrice } from "@/lib/utils/helpers";
import { submitCheckout } from "./actions";
import { Input, Select } from "@/components/ui/FormFields";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands",
  "Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir",
  "Ladakh","Lakshadweep","Puducherry",
].map((s) => ({ value: s, label: s }));

type SuccessData = {
  trackingId: string;
  totalAmount: number;
  paymentLink?: string;
  manualPayment: boolean;
};

/* ── Success screen ──────────────────────────────────────────────────────── */
function CheckoutSuccess({ data }: { data: SuccessData }) {
  const [copied, setCopied] = useState(false);
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "918101206698";
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi PrintVerse! My order ID is ${data.trackingId}. I'm ready to pay.`)}`;

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center animate-fade-in"
      style={{ boxShadow: "var(--shadow-card)" }}>
      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-black text-[#0B1F4D] mb-2">Order Received!</h2>
      <p className="text-slate-500 text-sm mb-6">
        {data.manualPayment
          ? "Your order is placed. Our team will send you a payment link shortly via WhatsApp or email."
          : "Click below to complete payment. We ship via India Post after a confirmation call."}
      </p>

      {/* Tracking ID */}
      <div className="bg-[#f0f4ff] border-2 border-dashed border-[#0B1F4D]/30 rounded-xl p-5 mb-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Your Tracking ID</p>
        <p className="text-4xl font-black text-[#0B1F4D] tracking-[0.12em] mb-3">{data.trackingId}</p>
        <button
          onClick={() => { navigator.clipboard.writeText(data.trackingId); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
          className="flex items-center gap-1.5 mx-auto text-xs text-[#0B1F4D] font-semibold hover:text-[#C41E2C] transition-colors"
          id="copy-tracking-checkout-btn"
        >
          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy ID"}
        </button>
      </div>

      <p className="text-xs text-[#C41E2C] font-semibold mb-6">
        ⚠ Save this ID — it&apos;s how you track your order
      </p>

      <div className="mb-6">
        <p className="text-sm text-slate-500 mb-1">Order total:</p>
        <p className="text-3xl font-black text-[#0B1F4D]">{formatPrice(data.totalAmount)}</p>
      </div>

      {/* CTA — Razorpay direct OR WhatsApp fallback */}
      {data.paymentLink ? (
        <a
          href={data.paymentLink}
          target="_blank"
          rel="noopener noreferrer"
          id="pay-now-btn"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#C41E2C] text-white font-black text-base hover:bg-[#a01824] transition-colors shadow-lg hover:shadow-[0_8px_30px_rgba(196,30,44,0.4)]"
        >
          Pay Now via Razorpay <ExternalLink className="h-5 w-5" />
        </a>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
            <p className="text-sm font-bold text-amber-800 mb-1">📲 We&apos;ll Contact You</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Our team will send you a secure Razorpay payment link via WhatsApp or email within a few hours.
              You can also message us directly with your order ID.
            </p>
          </div>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            id="whatsapp-order-btn"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1ea855] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Chat on WhatsApp
          </a>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-4">
        Questions? Track your order at{" "}
        <a href="/track" className="text-[#C41E2C] hover:underline">printverse.in/track</a>
      </p>
    </div>
  );
}

/* ── Main Checkout Form ───────────────────────────────────────────────────── */
export function CheckoutForm({
  product,
  deliveryCharge,
}: {
  product: Product;
  deliveryCharge: number;
}) {
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pincode verification state
  const [pincodeStatus, setPincodeStatus] = useState<
    "idle" | "checking" | "valid" | "invalid" | "timeout"
  >("idle");
  const [pincodeMsg, setPincodeMsg] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(checkoutFormSchema) as any,
    defaultValues: { quantity: 1, delivery_method: "shipment" },
  });

  const quantity = watch("quantity") || 1;
  const deliveryMethod = watch("delivery_method") || "shipment";
  const currentDeliveryCharge = deliveryMethod === "pickup" ? 0 : deliveryCharge;
  const MIN_PRICE = 4 * 50; // ₹200
  const subtotal = Math.max(product.price * quantity, MIN_PRICE * quantity);
  const totalAmount = subtotal + currentDeliveryCharge;

  // ── Pincode check ──────────────────────────────────────────────────────────
  const handlePincodeBlur = useCallback(
    async (pincode: string) => {
      if (!/^\d{6}$/.test(pincode)) return;
      setPincodeStatus("checking");
      setPincodeMsg("");
      const result = await validatePincode(pincode);
      if (result.valid) {
        setPincodeStatus("valid");
        setPincodeMsg(`✓ ${result.officeName}, ${result.district}`);
        if (result.district) setValue("delivery_city", result.district, { shouldValidate: true });
        if (result.state) setValue("delivery_state", result.state, { shouldValidate: true });
      } else if (result.error?.includes("timed out") || result.error?.includes("right now")) {
        setPincodeStatus("timeout");
        setPincodeMsg(result.error);
      } else {
        setPincodeStatus("invalid");
        setPincodeMsg(result.error ?? "Invalid pincode.");
      }
    },
    [setValue]
  );

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data: CheckoutFormData) => {
    setSubmitting(true);
    try {
      const res = await submitCheckout({ ...data, productId: product.id });
      if (res.success) {
        setSuccess({
          trackingId: res.trackingId,
          paymentLink: res.paymentLink,
          totalAmount: res.totalAmount,
          manualPayment: res.manualPayment,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast.error(res.error ?? "Checkout failed. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return <CheckoutSuccess data={success} />;

  return (
    <div className="space-y-6">
      {/* Product summary */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex gap-4 items-start"
        style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-[#f8f9fb] shrink-0">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
          ) : (
            <ShoppingCart className="h-8 w-8 text-slate-200 m-auto mt-6" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-black text-[#0B1F4D] text-base">{product.name}</p>
          <p className="text-slate-400 text-xs mt-0.5">{product.category}</p>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal (×{quantity})</span>
              <span className="font-semibold text-[#0B1F4D]">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery ({deliveryMethod === "pickup" ? "Self Pick-up" : "India Post"})</span>
              <span className="font-semibold text-[#0B1F4D]">{currentDeliveryCharge === 0 ? "Free" : formatPrice(currentDeliveryCharge)}</span>
            </div>
            <div className="flex justify-between border-t border-[#e2e8f0] pt-1.5 mt-0.5">
              <span className="font-black text-[#0B1F4D]">Total</span>
              <span className="font-black text-[#C41E2C] text-lg">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6"
          style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-black text-[#0B1F4D] mb-5">Your Details</h2>
          <div className="space-y-4">
            <Input label="Full Name" required placeholder="e.g. Riya Ghosh" id="checkout-name"
              error={errors.customer_name?.message} {...register("customer_name")} />
            <Input label="Email Address" type="email" required placeholder="you@example.com" id="checkout-email"
              error={errors.email?.message} {...register("email")} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#0B1F4D]">
                Phone Number <span className="text-[#C41E2C]">*</span>
              </label>
              <Controller name="phone" control={control} render={({ field }) => (
                <PhoneInput defaultCountry="in" value={field.value} onChange={field.onChange}
                  inputStyle={{ width: "100%", padding: "10px 16px", borderRadius: "0.75rem",
                    border: errors.phone ? "1px solid #f87171" : "1px solid #e2e8f0",
                    fontSize: "14px", color: "#0B1F4D", fontFamily: "Inter, sans-serif", outline: "none" }}
                  countrySelectorStyleProps={{ buttonStyle: {
                    border: errors.phone ? "1px solid #f87171" : "1px solid #e2e8f0",
                    borderRight: "none", borderRadius: "0.75rem 0 0 0.75rem", padding: "0 10px" } }} />
              )} />
              {errors.phone && <p className="text-xs text-red-600 font-medium">{errors.phone.message}</p>}
            </div>
            <Input label="Quantity" type="number" min={1} max={100} required id="checkout-quantity"
              error={errors.quantity?.message} {...register("quantity")} />
          </div>
        </div>

        {/* Delivery Method */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6"
          style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-black text-[#0B1F4D] mb-3">Delivery Option</h2>
          <p className="text-xs text-slate-400 mb-5">
            Choose how you would like to receive your 3D printed items.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setValue("delivery_method", "shipment");
              }}
              className={[
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 text-center transition-all cursor-pointer",
                deliveryMethod === "shipment"
                  ? "border-[#0B1F4D] bg-[#0B1F4D]/5 text-[#0B1F4D]"
                  : "border-[#e2e8f0] bg-white text-slate-500 hover:border-slate-300"
              ].join(" ")}
            >
              <MapPin className="h-6 w-6 mb-2" />
              <span className="text-sm font-bold">Home Delivery</span>
              <span className="text-[10px] opacity-75 mt-1">Flat {formatPrice(deliveryCharge)} via India Post</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("delivery_method", "pickup");
                setValue("delivery_address_line", "Self Pick-up - IIFR Lab, IEM Kolkata", { shouldValidate: true });
                setValue("delivery_city", "Kolkata", { shouldValidate: true });
                setValue("delivery_state", "West Bengal", { shouldValidate: true });
                setValue("delivery_pincode", "700091", { shouldValidate: true });
              }}
              className={[
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 text-center transition-all cursor-pointer",
                deliveryMethod === "pickup"
                  ? "border-[#0B1F4D] bg-[#0B1F4D]/5 text-[#0B1F4D]"
                  : "border-[#e2e8f0] bg-white text-slate-500 hover:border-slate-300"
              ].join(" ")}
            >
              <CheckCircle2 className="h-6 w-6 mb-2" />
              <span className="text-sm font-bold">Self Pick-up</span>
              <span className="text-[10px] opacity-75 mt-1">Free — Pick up at IIFR Lab</span>
            </button>
          </div>
        </div>

        {/* Delivery address or Pickup info */}
        {deliveryMethod === "shipment" ? (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6"
            style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="font-black text-[#0B1F4D] mb-1">Delivery Address</h2>
            <p className="text-xs text-slate-400 mb-5">
              Shipped via <strong>India Post</strong>. Enter pincode first to auto-fill city &amp; state.
            </p>
            <div className="space-y-4">
              {/* Pincode */}
              <div>
                <div className="flex gap-2">
                  <Input
                    label="Pincode" required maxLength={6} id="checkout-pincode"
                    placeholder="6-digit pincode"
                    error={errors.delivery_pincode?.message}
                    containerClassName="flex-1"
                    {...register("delivery_pincode", {
                      onBlur: (e) => handlePincodeBlur(e.target.value),
                    })}
                  />
                  {pincodeStatus === "checking" && (
                    <div className="flex items-end pb-2.5">
                      <Loader2 className="h-5 w-5 animate-spin text-[#0B1F4D]" />
                    </div>
                  )}
                </div>
                {pincodeStatus !== "idle" && pincodeStatus !== "checking" && (
                  <div className={[
                    "flex items-start gap-2 mt-1.5 text-xs font-medium",
                    pincodeStatus === "valid" ? "text-green-700" : "text-amber-700",
                  ].join(" ")}>
                    {pincodeStatus === "valid"
                      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      : <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                    <span>{pincodeMsg}</span>
                  </div>
                )}
              </div>

              <Input label="Full Address" required id="checkout-address"
                placeholder="House/Flat no., Street, Area, Landmark"
                error={errors.delivery_address_line?.message}
                {...register("delivery_address_line")} />

              <div className="grid grid-cols-2 gap-4">
                <Input label="City / District" required id="checkout-city"
                  placeholder="e.g. Kolkata"
                  error={errors.delivery_city?.message}
                  {...register("delivery_city")} />
                <Select label="State" required id="checkout-state"
                  placeholder="Select state…"
                  options={INDIAN_STATES}
                  error={errors.delivery_state?.message}
                  {...register("delivery_state")} />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#f0f4ff]/70 rounded-2xl border border-dashed border-[#0B1F4D]/20 p-6 flex gap-4 items-start animate-fade-in">
            <MapPin className="h-6 w-6 text-[#0B1F4D] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#0B1F4D] text-sm">Pick up Point</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                <strong>IIFR Lab, IEM Kolkata</strong><br />
                Management House, D-1, Salt Lake Sector V, Kolkata, West Bengal 700091.
              </p>
              <p className="text-[10px] text-[#C41E2C] mt-2 font-bold uppercase tracking-wider">
                ★ No delivery charges apply. We will notify you once printing is complete.
              </p>
            </div>
          </div>
        )}

        {/* Delivery note */}
        {deliveryMethod === "shipment" ? (
          <div className="flex gap-3 p-4 bg-[#f8f9fb] rounded-xl border border-[#e2e8f0]">
            <MapPin className="h-5 w-5 text-[#0B1F4D] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#0B1F4D]">Delivery via India Post</p>
              <p className="text-xs text-slate-500 mt-0.5">
                After payment, we'll call you to confirm before printing.
                Estimated delivery: 5–8 working days after dispatch.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 p-4 bg-[#f8f9fb] rounded-xl border border-[#e2e8f0]">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#0B1F4D]">Self Pick-up Selected</p>
              <p className="text-xs text-slate-500 mt-0.5">
                We'll call you to confirm before printing. You will receive a notification
                to collect your custom print once it is ready at the IIFR Lab.
              </p>
            </div>
          </div>
        )}

        <Button type="submit" variant="accent" size="lg" loading={submitting}
          className="w-full" id="checkout-submit-btn"
          icon={<ShoppingCart className="h-5 w-5" />}>
          {submitting ? "Processing…" : `Place Order — ${formatPrice(totalAmount)}`}
        </Button>

        <p className="text-center text-xs text-slate-400">
          Your order is secured. Payment via Razorpay or we&apos;ll send you a link directly.
        </p>
      </form>
    </div>
  );
}
