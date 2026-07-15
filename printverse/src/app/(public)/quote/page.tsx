import type { Metadata } from "next";
import { Suspense } from "react";
import { QuoteForm } from "./QuoteForm";

export const metadata: Metadata = {
  title: "Request a Quote",
  description:
    "Submit your 3D printing request to PrintVerse Technologies. Upload your STL file or describe your idea — we'll send you a quote within 24 hours.",
};

export default function QuotePage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Page header */}
      <section className="bg-hero-gradient text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="ribbon-badge mb-6 inline-flex">
            Free Quote · No Commitment
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Request a <span style={{ color: "#D4A017" }}>Free Quote</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Tell us about your project. We&apos;ll review it and respond within{" "}
            <strong className="text-white">24 hours</strong>.
          </p>
        </div>
      </section>

      {/* Form section */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Suspense fallback={
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 space-y-6">
              <div className="h-6 bg-slate-100 rounded w-1/3 animate-pulse" />
              <div className="space-y-3">
                <div className="h-10 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 bg-slate-100 rounded animate-pulse" />
                <div className="h-28 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          }>
            <QuoteForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
