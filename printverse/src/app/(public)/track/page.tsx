import type { Metadata } from "next";
import { TrackOrderClient } from "./TrackOrderClient";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your 3D printing order status with PrintVerse Technologies. Enter your Tracking ID or look up by phone and email.",
};

export default function TrackPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <section className="bg-hero-gradient text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="ribbon-badge mb-6 inline-flex">Real-time Status</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Track Your <span style={{ color: "#D4A017" }}>Order</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Enter your Tracking ID or look up by phone &amp; email.
          </p>
        </div>
      </section>

      {/* Client component with tabs and search */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <TrackOrderClient />
        </div>
      </section>
    </div>
  );
}
