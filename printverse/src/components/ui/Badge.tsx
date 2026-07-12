import React from "react";
import type { OrderStatus, OrderType } from "@/types";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

interface OrderTypeBadgeProps {
  type: OrderType;
  className?: string;
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "purple";
  className?: string;
}

// Maps status string to CSS class (defined in globals.css)
function getStatusClass(status: OrderStatus): string {
  return "status-" + status.replace(/\s+/g, "-");
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        getStatusClass(status),
        className,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

export function OrderTypeBadge({ type, className = "" }: OrderTypeBadgeProps) {
  const styles =
    type === "purchase"
      ? "bg-[#0B1F4D] text-white"
      : "bg-[#D4A017]/20 text-[#0B1F4D]";
  const label = type === "purchase" ? "🛒 Buy Now" : "📋 Quote";
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        styles,
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const variantMap: Record<string, string> = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
  };
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variantMap[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
