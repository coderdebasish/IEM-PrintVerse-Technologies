"use client";

import { useState, useRef, useCallback, useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { useForm, Controller } from "react-hook-form";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  Copy,
  CheckCircle2,
  FileText,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import { quoteFormSchema, type QuoteFormData } from "@/lib/validations/schemas";
import { submitQuote, getProductBySlug } from "./actions";
import { Input, Textarea, Select } from "@/components/ui/FormFields";
import { Button } from "@/components/ui/Button";

const MATERIAL_OPTIONS = [
  { value: "PLA", label: "PLA — General purpose (most popular)" },
  { value: "ABS", label: "ABS — Heat resistant, durable" },
  { value: "PETG", label: "PETG — Flexible & food-safe" },
  { value: "Resin", label: "Resin — Ultra fine detail" },
  { value: "Not Sure", label: "Not Sure — We'll recommend" },
];

const INFILL_OPTIONS = [
  { value: "Standard", label: "Standard — General use" },
  { value: "High Strength", label: "High Strength — Structural parts" },
  { value: "Not Sure", label: "Not Sure" },
];

const FINISH_OPTIONS = [
  { value: "Draft/Fast", label: "Draft / Fast — Quick turnaround" },
  { value: "Standard", label: "Standard — Balanced quality" },
  { value: "Fine Detail", label: "Fine Detail — Best quality" },
  { value: "Not Sure", label: "Not Sure" },
];

// ── STL file validation ────────────────────────────────────────────────────

async function validateSTLFile(file: File): Promise<string | null> {
  if (!file.name.toLowerCase().endsWith(".stl")) {
    return "Only .stl files are accepted.";
  }
  if (file.size > 50 * 1024 * 1024) {
    return "File too large. Maximum size is 50 MB.";
  }
  if (file.size === 0) {
    return "File is empty. Please select a valid STL file.";
  }

  // Byte-sniff: read first 84 bytes to detect STL type
  const buffer = await file.slice(0, 84).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const header = new TextDecoder().decode(bytes.slice(0, 6)).toLowerCase();
  const isTextSTL = header.startsWith("solid");

  // Binary STL: first 80 bytes are header, then 4-byte triangle count
  // We accept both text and binary as valid
  if (!isTextSTL && bytes.length < 84) {
    return "File does not appear to be a valid STL file.";
  }

  return null; // valid
}

// ── Success Screen ─────────────────────────────────────────────────────────

function SuccessScreen({ trackingId }: { trackingId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center animate-fade-in"
      style={{ boxShadow: "var(--shadow-card)" }}>
      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
      <h2 className="text-2xl font-black text-[#0B1F4D] mb-2">
        Request Submitted!
      </h2>
      <p className="text-slate-500 text-sm mb-8">
        We&apos;ll review your request and get back to you within{" "}
        <strong className="text-[#0B1F4D]">24 hours</strong>. Save your
        tracking ID — it&apos;s the only way to check your order status.
      </p>

      <div className="bg-[#f0f4ff] border-2 border-dashed border-[#0B1F4D]/30 rounded-xl p-6 mb-6">
        <p className="text-xs font-bold text-[#64748b] uppercase tracking-widest mb-3">
          Your Tracking ID
        </p>
        <p
          className="text-5xl font-black text-[#0B1F4D] tracking-[0.15em] mb-4"
          id="tracking-id-display"
        >
          {trackingId}
        </p>
        <Button
          onClick={handleCopy}
          variant={copied ? "outline" : "primary"}
          size="md"
          icon={copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          id="copy-tracking-id-btn"
        >
          {copied ? "Copied!" : "Copy Tracking ID"}
        </Button>
      </div>

      <p className="text-xs text-[#C41E2C] font-semibold mb-6">
        ⚠ Screenshot or write this down — it won&apos;t appear again
      </p>

      <a
        href="/track"
        className="inline-flex items-center gap-2 text-[#0B1F4D] font-semibold text-sm hover:text-[#C41E2C] transition-colors"
      >
        Track your order later →
      </a>
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────────────────────

export function QuoteForm() {
  const searchParams = useSearchParams();
  const productSlug = searchParams.get("product");

  const [prefsOpen, setPrefsOpen] = useState(false);
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [stlError, setStlError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<{ trackingId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [taggedProduct, setTaggedProduct] = useState<{
    id: string;
    name: string;
    image_url: string;
    category: string;
  } | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<QuoteFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(quoteFormSchema) as any,
    defaultValues: { print_preferences: { quantity: 1 } },
  });

  useEffect(() => {
    if (productSlug) {
      setLoadingProduct(true);
      getProductBySlug(productSlug)
        .then((prod) => {
          if (prod) {
            setTaggedProduct({
              id: prod.id,
              name: prod.name,
              image_url: prod.image_url || (prod.image_urls && prod.image_urls[0]) || "",
              category: prod.category || (prod.categories && prod.categories[0]) || "",
            });
            setValue("product_id", prod.id);
          }
        })
        .catch((err) => {
          console.error("Failed to load product tag:", err);
        })
        .finally(() => {
          setLoadingProduct(false);
        });
    }
  }, [productSlug, setValue]);

  // ── File handling ──────────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (file: File) => {
    const error = await validateSTLFile(file);
    if (error) {
      setStlError(error);
      setStlFile(null);
    } else {
      setStlError(null);
      setStlFile(file);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // ── Submit ─────────────────────────────────────────────────────────────

  const onSubmit = async (data: QuoteFormData) => {
    setSubmitting(true);
    try {
      let stlBase64: string | undefined;
      let stlFileName: string | undefined;

      if (stlFile) {
        const arrayBuffer = await stlFile.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        let binary = "";
        uint8.forEach((b) => (binary += String.fromCharCode(b)));
        stlBase64 = btoa(binary);
        stlFileName = stlFile.name;
      }

      const res = await submitQuote({ ...data, stlBase64, stlFileName });

      if (res.success) {
        setResult({ trackingId: res.trackingId });
      } else {
        toast.error(res.error || "Submission failed. Please try again.");
      }
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────

  if (result) {
    return <SuccessScreen trackingId={result.trackingId} />;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => {
        toast.error("Please fill in all required fields correctly before submitting.");
      })}
      noValidate
      className="space-y-6"
    >
      {/* Product Tagging Card */}
      {loadingProduct && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 flex items-center gap-3 animate-pulse">
          <div className="h-12 w-12 rounded-lg bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
          </div>
        </div>
      )}

      {!loadingProduct && taggedProduct && (
        <div className="bg-[#0B1F4D]/5 rounded-2xl border-2 border-[#0B1F4D]/20 p-5 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-4">
            {taggedProduct.image_url ? (
              <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-50 border border-[#e2e8f0] shrink-0">
                <Image
                  src={taggedProduct.image_url}
                  alt={taggedProduct.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-slate-300" />
              </div>
            )}
            <div>
              <span className="text-[10px] font-bold text-[#C41E2C] uppercase tracking-wider block mb-0.5">
                Product Customization Link
              </span>
              <h4 className="font-bold text-[#0B1F4D] text-base leading-tight">
                {taggedProduct.name}
              </h4>
              <span className="inline-block text-[10px] font-medium bg-[#0B1F4D]/10 text-[#0B1F4D] px-2.5 py-0.5 rounded-full mt-1.5 border border-[#0B1F4D]/20">
                {taggedProduct.category}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setTaggedProduct(null);
              setValue("product_id", undefined);
            }}
            className="p-1.5 rounded-lg hover:bg-[#0B1F4D]/10 text-[#0B1F4D]/60 hover:text-[#C41E2C] transition-colors cursor-pointer"
            title="Remove product tag"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Card: Core Info */}
      <div
        className="bg-white rounded-2xl border border-[#e2e8f0] p-7"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="text-lg font-black text-[#0B1F4D] mb-6">
          Your Details
        </h2>

        <div className="space-y-5">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Rahul Sharma"
            id="quote-name"
            error={errors.customer_name?.message}
            {...register("customer_name")}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="you@example.com"
            id="quote-email"
            error={errors.email?.message}
            {...register("email")}
          />

          {/* Phone with international picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#0B1F4D]">
              Phone Number <span className="text-[#C41E2C]">*</span>
            </label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  defaultCountry="in"
                  value={field.value}
                  onChange={field.onChange}
                  inputStyle={{
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: "0.75rem",
                    border: errors.phone
                      ? "1px solid #f87171"
                      : "1px solid #e2e8f0",
                    fontSize: "14px",
                    color: "#0B1F4D",
                    fontFamily: "Inter, sans-serif",
                    outline: "none",
                  }}
                  countrySelectorStyleProps={{
                    buttonStyle: {
                      border: errors.phone
                        ? "1px solid #f87171"
                        : "1px solid #e2e8f0",
                      borderRight: "none",
                      borderRadius: "0.75rem 0 0 0.75rem",
                      padding: "0 10px",
                    },
                  }}
                />
              )}
            />
            {errors.phone && (
              <p className="text-xs text-red-600 font-medium">
                {errors.phone.message}
              </p>
            )}
          </div>

          <Textarea
            label="Message / Project Description"
            id="quote-message"
            placeholder="Describe your idea, dimensions, purpose… The more detail the better!"
            rows={4}
            error={errors.message?.message}
            {...register("message")}
          />
        </div>
      </div>

      {/* Card: STL Upload */}
      <div
        className="bg-white rounded-2xl border border-[#e2e8f0] p-7"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="text-lg font-black text-[#0B1F4D] mb-1">
          STL File{" "}
          <span className="text-sm font-normal text-slate-400">(optional)</span>
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Upload your 3D model file. Only .stl files accepted, max 50 MB.
        </p>

        {!stlFile ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            id="stl-upload-zone"
            className={[
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isDragging
                ? "border-[#C41E2C] bg-[#C41E2C]/5"
                : "border-[#e2e8f0] hover:border-[#0B1F4D]/40 hover:bg-[#f8f9fb]",
              stlError ? "border-red-400 bg-red-50" : "",
            ].join(" ")}
          >
            <Upload className="mx-auto h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-[#0B1F4D]">
              {isDragging ? "Drop it here!" : "Click or drag & drop your STL"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              .stl files only · Max 50 MB
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-[#f0f4ff] border border-[#0B1F4D]/20 rounded-xl">
            <FileText className="h-8 w-8 text-[#0B1F4D] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0B1F4D] truncate">
                {stlFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {(stlFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setStlFile(null); setStlError(null); }}
              className="p-1.5 rounded-lg hover:bg-[#0B1F4D]/10 text-slate-500 hover:text-[#C41E2C] transition-colors"
              aria-label="Remove STL file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {stlError && (
          <p className="text-xs text-red-600 font-medium mt-2">{stlError}</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".stl"
          className="hidden"
          id="stl-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      {/* Card: 3D Printing Preferences (collapsible) */}
      <div
        className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <button
          type="button"
          id="prefs-toggle"
          onClick={() => setPrefsOpen(!prefsOpen)}
          className="w-full flex items-center justify-between p-7 text-left hover:bg-[#f8f9fb] transition-colors"
        >
          <div>
            <p className="font-black text-[#0B1F4D]">
              3D Printing Preferences
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Optional — helps us plan. Skip if unsure.
            </p>
          </div>
          {prefsOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
          )}
        </button>

        {prefsOpen && (
          <div className="px-7 pb-7 space-y-5 border-t border-[#e2e8f0] pt-5 animate-fade-in">
            <p className="text-xs text-slate-500 bg-[#f8f9fb] rounded-lg p-3">
              This information helps us prepare your print. It{" "}
              <strong>never automatically sets your price</strong> — all quotes
              are manually reviewed by our team.
            </p>

            <Select
              label="Preferred Material"
              id="pref-material"
              placeholder="Choose material…"
              options={MATERIAL_OPTIONS}
              error={errors.print_preferences?.material?.message}
              {...register("print_preferences.material")}
            />

            <Input
              label="Preferred Color"
              id="pref-color"
              placeholder="e.g. Matte black, Pearl white, Royal blue…"
              error={errors.print_preferences?.color?.message}
              {...register("print_preferences.color")}
            />

            <Select
              label="Strength / Infill"
              id="pref-infill"
              placeholder="Choose infill…"
              options={INFILL_OPTIONS}
              error={errors.print_preferences?.infill?.message}
              {...register("print_preferences.infill")}
            />

            <Select
              label="Finish Quality"
              id="pref-finish"
              placeholder="Choose finish…"
              options={FINISH_OPTIONS}
              error={errors.print_preferences?.finish?.message}
              {...register("print_preferences.finish")}
            />

            <Input
              label="Quantity"
              type="number"
              id="pref-quantity"
              min={1}
              max={1000}
              defaultValue={1}
              error={errors.print_preferences?.quantity?.message}
              {...register("print_preferences.quantity")}
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="accent"
        size="lg"
        loading={submitting}
        id="quote-submit-btn"
        className="w-full"
      >
        {submitting ? "Submitting…" : "Submit Quote Request"}
      </Button>

      <p className="text-center text-xs text-slate-400">
        By submitting, you agree to be contacted about your quote. No spam — promise.
      </p>
    </form>
  );
}
