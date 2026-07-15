import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FeedbackForm } from "./FeedbackForm";
import { CheckCircle2, MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Feedback — PrintVerse",
  description: "Share your experience with PrintVerse Technologies.",
};

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const service = createServiceClient();

  // Find order by token
  const { data: order, error: orderError } = await service
    .from("orders")
    .select("id, tracking_id, customer_name")
    .eq("feedback_token", token)
    .single();

  if (orderError || !order) {
    notFound();
  }

  // Check if feedback already exists
  const { data: existingFeedback } = await service
    .from("feedback")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[#f8f9fb] py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1F4D] text-[#D4A017]">
              <MessageSquare className="h-6 w-6" />
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0B1F4D]">PrintVerse Technologies</h1>
          <p className="text-sm text-slate-500 mt-1">IIFR Lab, IEM Kolkata</p>
        </div>

        {existingFeedback ? (
          <div
            className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-[#0B1F4D] mb-2">Review Already Submitted</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              You have already shared your feedback for order <strong>#{order.tracking_id}</strong>. Thank you for your support!
            </p>
            <a
              href="/home"
              className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-[#0B1F4D] text-white font-bold text-sm hover:bg-[#071432] transition-colors"
            >
              Go to Homepage
            </a>
          </div>
        ) : (
          <FeedbackForm
            token={token}
            customerName={order.customer_name}
            trackingId={order.tracking_id}
          />
        )}
      </div>
    </div>
  );
}
