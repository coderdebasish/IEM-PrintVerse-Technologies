"use client";

import { useState } from "react";
import { ShieldAlert, X, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SecurityPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => Promise<{ success: boolean; error?: string }>;
  title?: string;
  description?: string;
  itemIdentifier?: string;
}

export function SecurityPinModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  description = "Enter the 6-digit security PIN to permanently delete this record from the database. This cannot be undone.",
  itemIdentifier,
}: SecurityPinModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg("Security PIN is required.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await onConfirm(pin.trim());
      if (res.success) {
        setPin("");
        onClose();
      } else {
        setErrorMsg(res.error ?? "Invalid PIN or failed to delete.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-red-100 shadow-2xl overflow-hidden"
        style={{ boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              {itemIdentifier && (
                <p className="text-xs font-mono text-slate-500 font-bold">
                  {itemIdentifier}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {description}
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              Security PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="••••••"
              maxLength={10}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-mono text-lg tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-slate-50 transition-all"
              id="security-pin-input"
            />
            {errorMsg && (
              <p className="text-xs font-semibold text-red-600 animate-in fade-in">
                ⚠️ {errorMsg}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              type="submit"
              loading={loading}
              variant="danger"
              size="md"
              id="confirm-delete-btn"
              icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              Confirm Delete
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
