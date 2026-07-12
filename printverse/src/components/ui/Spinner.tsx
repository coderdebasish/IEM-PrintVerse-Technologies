import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "accent" | "white";
  className?: string;
}

const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
const colorMap = {
  primary: "text-[#0B1F4D]",
  accent: "text-[#C41E2C]",
  white: "text-white",
};

export function Spinner({ size = "md", color = "primary", className = "" }: SpinnerProps) {
  return (
    <svg
      className={["animate-spin", sizeMap[size], colorMap[color], className].join(" ")}
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
      role="status"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}

/** Full-page loading overlay */
export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" color="accent" />
        <p className="text-sm text-[#0B1F4D] font-medium">Loading…</p>
      </div>
    </div>
  );
}
