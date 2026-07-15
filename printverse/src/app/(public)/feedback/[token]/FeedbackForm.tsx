"use client";

import { useState } from "react";
import { Star, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { submitFeedback } from "./actions";
import { Button } from "@/components/ui/Button";

export function FeedbackForm({
  token,
  customerName,
  trackingId,
}: {
  token: string;
  customerName: string;
  trackingId: string;
}) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await submitFeedback(token, { rating, title, message });
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error ?? "Failed to submit feedback.");
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center animate-fade-in" style={{ boxShadow: "var(--shadow-card)" }}>
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-[#0B1F4D] mb-2">Thank You!</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Your feedback has been successfully submitted. We appreciate you taking the time to share your experience with PrintVerse Technologies.
        </p>
        <a
          href="/home"
          className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-[#0B1F4D] text-white font-bold text-sm hover:bg-[#071432] transition-colors"
        >
          Go to Homepage
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 sm:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="mb-6">
        <h2 className="text-xl font-black text-[#0B1F4D] mb-1">Share Your Experience</h2>
        <p className="text-xs text-slate-500">
          Dear <strong className="text-[#0B1F4D]">{customerName}</strong>, please share your thoughts on order <strong className="text-[#0B1F4D]">#{trackingId}</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Rating stars */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#0B1F4D] block">
            Overall Rating <span className="text-[#C41E2C]">*</span>
          </label>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, idx) => {
              const starVal = idx + 1;
              const isFilled = hoverRating !== null ? starVal <= hoverRating : starVal <= rating;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRating(starVal)}
                  onMouseEnter={() => setHoverRating(starVal)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={[
                      "h-8 w-8 transition-colors",
                      isFilled
                        ? "fill-[#D4A017] text-[#D4A017]"
                        : "text-slate-200 hover:text-[#D4A017]/50",
                    ].join(" ")}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#0B1F4D] block">
            Review Title <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Excellent print quality!"
            className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#C41E2C]/30 focus:border-[#C41E2C]/80"
          />
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#0B1F4D] block">
            Your Review <span className="text-[#C41E2C]">*</span>
          </label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you liked, how the 3D print looks, or how we can improve..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] text-sm text-[#0B1F4D] focus:outline-none focus:ring-2 focus:ring-[#C41E2C]/30 focus:border-[#C41E2C]/80 resize-none"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
        >
          {loading ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </div>
  );
}
