import type { Metadata } from "next";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with PrintVerse Technologies — IIFR Lab, IEM Kolkata. WhatsApp, email, or request a quote.",
};

export default function ContactPage() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918101206698";
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hi PrintVerse! I'd like to know more about your 3D printing services.")}`;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <section className="bg-hero-gradient text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="ribbon-badge mb-6 inline-flex">We&apos;re Here to Help</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Get in <span style={{ color: "#D4A017" }}>Touch</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Have a question? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            id="contact-whatsapp"
            className="group bg-white rounded-2xl border border-[#e2e8f0] p-7 card-hover flex flex-col gap-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366]">
              <MessageCircle className="h-6 w-6 text-white" />
            </span>
            <div>
              <h2 className="font-bold text-[#0B1F4D] text-lg mb-1">WhatsApp</h2>
              <p className="text-slate-500 text-sm">
                Chat with us directly for quick answers.
              </p>
            </div>
            <p className="text-[#25D366] font-bold text-sm group-hover:underline mt-auto">
              +91 8101 206 698 →
            </p>
          </a>

          {/* Email */}
          <div
            className="bg-white rounded-2xl border border-[#e2e8f0] p-7"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B1F4D] mb-4">
              <Mail className="h-6 w-6 text-[#D4A017]" />
            </span>
            <h2 className="font-bold text-[#0B1F4D] text-lg mb-1">Email</h2>
            <p className="text-slate-500 text-sm mb-3">
              For formal inquiries or bulk orders.
            </p>
            {/* SCAFFOLD: Replace with real business email when available */}
            <p className="text-sm text-slate-400 italic">
              Business email coming soon — use WhatsApp for now.
            </p>
          </div>

          {/* Location */}
          <div
            className="bg-white rounded-2xl border border-[#e2e8f0] p-7"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4A017] mb-4">
              <MapPin className="h-6 w-6 text-[#0B1F4D]" />
            </span>
            <h2 className="font-bold text-[#0B1F4D] text-lg mb-1">Location</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              IIFR Lab, Institute of Engineering & Management
              <br />
              Kolkata, West Bengal, India
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Supported by IEMRF
            </p>
          </div>

          {/* Quote CTA */}
          <div
            className="bg-[#0B1F4D] rounded-2xl p-7 flex flex-col justify-between"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div>
              <h2 className="font-bold text-white text-lg mb-2">
                Ready to order?
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Submit a quote request and we&apos;ll get back to you within 24 hours.
              </p>
            </div>
            <Link
              href="/quote"
              id="contact-quote-cta"
              className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C41E2C] text-white font-bold text-sm hover:bg-[#a01824] transition-colors"
            >
              Request a Quote →
            </Link>
          </div>
        </div>

        {/* Mentors section */}
        <div className="max-w-3xl mx-auto mt-8">
          <div
            className="bg-white rounded-2xl border border-[#e2e8f0] p-7"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h2 className="font-black text-[#0B1F4D] text-lg mb-4">Our Mentors</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                "Mr. Diptiman Dasgupta",
                "Dr. Prabir Kumar Das",
                "Dr. Chandan Adhikari",
                "Dr. Ranabir Banik",
              ].map((name) => (
                <div
                  key={name}
                  className="text-center p-4 bg-[#f8f9fb] rounded-xl border border-[#e2e8f0]"
                >
                  <div className="h-12 w-12 rounded-full bg-[#0B1F4D] flex items-center justify-center mx-auto mb-3">
                    <span className="text-[#D4A017] font-black text-lg">
                      {name.split(" ").find(w => /^[A-Z]/.test(w) && w.length > 2)?.[0] || name[0]}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0B1F4D] leading-snug">
                    {name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
