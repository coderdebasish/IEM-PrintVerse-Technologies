import React from "react";

type Variant = "primary" | "accent" | "outline" | "ghost" | "gold" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#0B1F4D] text-white hover:bg-[#1a3a7a] active:bg-[#071435] shadow-sm",
  accent:
    "bg-[#C41E2C] text-white hover:bg-[#a01824] active:bg-[#800f1a] shadow-sm animate-pulse-glow",
  outline:
    "border-2 border-[#0B1F4D] text-[#0B1F4D] bg-transparent hover:bg-[#0B1F4D] hover:text-white",
  ghost:
    "bg-transparent text-[#0B1F4D] hover:bg-[#0B1F4D]/10",
  gold:
    "bg-[#D4A017] text-[#0B1F4D] font-bold hover:bg-[#f0c040] shadow-sm",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-base rounded-xl gap-2",
  lg: "px-7 py-3.5 text-lg rounded-xl gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={[
        "inline-flex items-center justify-center font-semibold",
        "transition-all duration-200 cursor-pointer select-none",
        "focus-visible:outline-2 focus-visible:outline-[#C41E2C] focus-visible:outline-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
