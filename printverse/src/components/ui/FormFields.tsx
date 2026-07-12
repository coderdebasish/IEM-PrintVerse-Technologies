import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const baseInputClass =
  "w-full px-4 py-2.5 rounded-xl border text-[#0B1F4D] bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#C41E2C]/40 focus:border-[#C41E2C] " +
  "transition-colors duration-150 placeholder:text-slate-400 text-sm";

const errorInputClass = "border-red-400 ring-1 ring-red-300";
const normalInputClass = "border-[#e2e8f0] hover:border-[#0B1F4D]/30";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, containerClassName = "", className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={["flex flex-col gap-1.5", containerClassName].join(" ")}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[#0B1F4D]">
            {label}
            {required && <span className="text-[#C41E2C] ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={[
            baseInputClass,
            error ? errorInputClass : normalInputClass,
            className,
          ].join(" ")}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-600 font-medium">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, containerClassName = "", className = "", id, rows = 4, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={["flex flex-col gap-1.5", containerClassName].join(" ")}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[#0B1F4D]">
            {label}
            {required && <span className="text-[#C41E2C] ml-1">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={[
            baseInputClass,
            "resize-y min-h-[100px]",
            error ? errorInputClass : normalInputClass,
            className,
          ].join(" ")}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, containerClassName = "", className = "", options, placeholder, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={["flex flex-col gap-1.5", containerClassName].join(" ")}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[#0B1F4D]">
            {label}
            {required && <span className="text-[#C41E2C] ml-1">*</span>}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={[
            baseInputClass,
            "cursor-pointer appearance-none",
            error ? errorInputClass : normalInputClass,
            className,
          ].join(" ")}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
