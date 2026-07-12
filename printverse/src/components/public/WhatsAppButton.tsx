"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918101206698";
  const message = encodeURIComponent(
    "Hi PrintVerse! I'd like to know more about your 3D printing services."
  );
  const href = `https://wa.me/${number}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with PrintVerse on WhatsApp"
      className={[
        "fixed bottom-6 right-6 z-50",
        "flex items-center gap-2 px-4 py-3 rounded-full",
        "bg-[#25D366] text-white font-semibold text-sm shadow-lg",
        "hover:bg-[#1ebe5c] hover:shadow-xl hover:scale-105",
        "transition-all duration-200",
        "group",
      ].join(" ")}
    >
      <MessageCircle className="h-5 w-5 shrink-0" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap">
        Chat with us
      </span>
    </a>
  );
}
