"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { OrderStatus, OrderType } from "@/types";

interface StatusTimelineProps {
  status: OrderStatus;
  orderType: OrderType;
  createdAt?: string;
}

const QUOTE_STAGES: OrderStatus[] = [
  "Requested",
  "Contacted",
  "Quoted",
  "Payment Pending",
  "Paid",
  "Printing",
  "Shipped",
  "Completed",
];

const PURCHASE_STAGES: OrderStatus[] = [
  "Payment Pending",
  "Payment Received",
  "Confirmed",
  "Printing",
  "Invoice Sent",
  "Shipped",
  "Completed",
];

const stageDescriptions: Partial<Record<OrderStatus, string>> = {
  Requested: "Your quote request has been received.",
  Contacted: "Our team has reached out to you.",
  Quoted: "A price has been determined for your order.",
  "Payment Pending": "Awaiting payment to proceed.",
  "Payment Received": "Payment received. Pending confirmation call.",
  Paid: "Payment confirmed.",
  Confirmed: "Order confirmed via call. Processing begins.",
  Printing: "Your item is currently being 3D printed.",
  "Invoice Sent": "Invoice has been sent to your email.",
  Shipped: "Your order is on its way via India Post.",
  Completed: "Order delivered successfully. Thank you!",
  Cancelled: "This order has been cancelled.",
};

export function StatusTimeline({ status, orderType }: StatusTimelineProps) {
  const stages = orderType === "purchase" ? PURCHASE_STAGES : QUOTE_STAGES;
  const isCancelled = status === "Cancelled";
  const currentIndex = isCancelled ? -1 : stages.indexOf(status);

  return (
    <div className="w-full">
      {/* Cancelled state */}
      {isCancelled && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
          <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Order Cancelled</p>
            <p className="text-sm text-red-600 mt-0.5">
              {stageDescriptions["Cancelled"]}
            </p>
          </div>
        </div>
      )}

      {/* Stage timeline */}
      <ol className="relative">
        {stages.map((stage, idx) => {
          const isDone = !isCancelled && idx < currentIndex;
          const isCurrent = !isCancelled && idx === currentIndex;
          const isFuture = isCancelled || idx > currentIndex;

          return (
            <li key={stage} className="flex gap-4 pb-6 last:pb-0">
              {/* Icon column */}
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isDone
                      ? "bg-green-500 border-green-500 text-white"
                      : isCurrent
                      ? "bg-[#C41E2C] border-[#C41E2C] text-white animate-pulse-glow"
                      : "bg-white border-slate-200 text-slate-400",
                  ].join(" ")}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>
                {idx < stages.length - 1 && (
                  <div
                    className={[
                      "mt-1 w-0.5 flex-1 min-h-[1.5rem]",
                      isDone ? "bg-green-400" : "bg-slate-200",
                    ].join(" ")}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pt-1 pb-2">
                <p
                  className={[
                    "text-sm font-semibold",
                    isCurrent
                      ? "text-[#C41E2C]"
                      : isDone
                      ? "text-green-700"
                      : "text-slate-400",
                  ].join(" ")}
                >
                  {stage}
                  {isCurrent && (
                    <span className="ml-2 text-xs font-normal bg-[#C41E2C]/10 text-[#C41E2C] px-1.5 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </p>
                {(isCurrent || isDone) && stageDescriptions[stage] && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {stageDescriptions[stage]}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
