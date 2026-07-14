"use client";

import { useState } from "react";
import { Truck, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { updateDeliveryRate } from "./actions";

export function SettingsClient({ deliveryRate }: { deliveryRate: number }) {
  const [rate, setRate] = useState(deliveryRate.toString());
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const val = parseFloat(rate);
    if (isNaN(val) || val < 0) {
      toast.error("Enter a valid delivery rate (0 or more).");
      return;
    }
    setLoading(true);
    const res = await updateDeliveryRate(val);
    setLoading(false);
    if (res.success) {
      toast.success("Delivery rate updated.");
    } else {
      toast.error(res.error ?? "Failed to update.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Delivery rate card */}
      <div
        className="bg-white rounded-2xl border border-[#e2e8f0] p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1F4D]">
            <Truck className="h-5 w-5 text-[#D4A017]" />
          </span>
          <div>
            <h2 className="font-black text-[#0B1F4D]">Delivery Charge</h2>
            <p className="text-xs text-slate-400">Applied to all Buy Now orders at checkout</p>
          </div>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label
              htmlFor="delivery-rate-input"
              className="text-sm font-semibold text-[#0B1F4D] block mb-1.5"
            >
              Flat Rate (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                id="delivery-rate-input"
                type="number"
                min="0"
                step="1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0B1F4D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E2C]/30 focus:border-[#C41E2C] transition-colors font-semibold"
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            loading={loading}
            variant="primary"
            size="md"
            icon={<Save className="h-4 w-4" />}
            id="save-delivery-rate-btn"
          >
            Save
          </Button>
        </div>

        <div className="mt-4 flex gap-2 p-3 bg-[#f8f9fb] rounded-xl border border-[#e2e8f0]">
          <Info className="h-4 w-4 text-[#0B1F4D] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Set to <strong>0</strong> for free delivery. This rate is added to the
            product subtotal at checkout and shown to the customer before payment.
            Changes apply immediately to all new orders.
          </p>
        </div>
      </div>

      {/* Pricing reminder card */}
      <div
        className="bg-[#0B1F4D] rounded-2xl p-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h3 className="font-bold text-[#D4A017] text-sm uppercase tracking-wider mb-3">
          Pricing Policy Reminder
        </h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>• Flat rate: <strong className="text-white">₹4 per gram</strong> for all products</li>
          <li>• Minimum order: <strong className="text-white">50 grams</strong> (₹200)</li>
          <li>• Items under 50g are billed as 50g</li>
          <li>• All quoted prices are set manually per order</li>
          <li>• Payment via Razorpay — no cash on delivery</li>
        </ul>
      </div>
    </div>
  );
}
