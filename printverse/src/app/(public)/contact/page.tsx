import type { Metadata } from "next";
import { Mail, Phone, MapPin, MessageCircle, Star } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with PrintVerse Technologies — IIFR Lab, IEM Kolkata. WhatsApp, email, or request a quote.",
};

const TEAM = [
  {
    name: "Debasish Mohanty",
    shortRole: "CEO",
    fullRole: "Founder & Chief Executive Officer",
    expertise: "Business Strategy · 3D Printing Technology · Full-Stack Development",
    phone: "+91 8101 206 698",
    initials: "DM",
    isFounder: true,
    accent: "#D4A017",
  },
  {
    name: "Suchana Saha",
    shortRole: "CDO",
    fullRole: "Chief Design Officer",
    expertise: "Creative Direction · Brand Identity · Visual Design",
    initials: "SS",
    isFounder: false,
    accent: "#7C3AED",
  },
  {
    name: "Sounak Chakraborty",
    shortRole: "COO",
    fullRole: "Chief Operations Officer",
    expertise: "Operations Management · Workflow Optimization · Logistics",
    initials: "SC",
    isFounder: false,
    accent: "#0891B2",
  },
  {
    name: "Shubham Giri",
    shortRole: "CRIO",
    fullRole: "Chief Research & Innovation Officer",
    expertise: "R&D Strategy · Material Science · Innovation Pipelines",
    initials: "SG",
    isFounder: false,
    accent: "#059669",
  },
  {
    name: "Aitihya Mondal",
    shortRole: "CTO",
    fullRole: "Chief Technology Officer",
    expertise: "Hardware Engineering · Firmware · Prototype Development",
    initials: "AM",
    isFounder: false,
    accent: "#EA580C",
  },
  {
    name: "Soumik Nath",
    shortRole: "CMBDO",
    fullRole: "Chief Marketing & Business Development Officer",
    expertise: "Growth Strategy · Client Relations · Market Expansion",
    initials: "SN",
    isFounder: false,
    accent: "#DB2777",
  },
];

const MENTORS = [
  { name: "Mr. Diptiman Dasgupta", role: "Industry Mentor" },
  { name: "Dr. Prabir Kumar Das", role: "Academic Mentor" },
  { name: "Dr. Chandan Adhikari", role: "Research Advisor" },
  { name: "Dr. Ranabir Banik", role: "Technical Advisor" },
];

export default function ContactPage() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918101206698";
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hi PrintVerse! I'd like to know more about your 3D printing services.")}`;

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Hero */}
      <section className="bg-hero-gradient text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="ribbon-badge mb-6 inline-flex">We&apos;re Here to Help</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Get in <span style={{ color: "#D4A017" }}>Touch</span>
          </h1>
          <p className="text-slate-300 text-lg">Have a question? We&apos;d love to hear from you.</p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-10">

          {/* Contact cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href={waLink} target="_blank" rel="noopener noreferrer" id="contact-whatsapp"
              className="group bg-white rounded-2xl border border-[#e2e8f0] p-7 card-hover flex flex-col gap-4"
              style={{ boxShadow: "var(--shadow-card)" }}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366]">
                <MessageCircle className="h-6 w-6 text-white" />
              </span>
              <div>
                <h2 className="font-bold text-[#0B1F4D] text-lg mb-1">WhatsApp</h2>
                <p className="text-slate-500 text-sm">Chat directly for quick answers.</p>
              </div>
              <p className="text-[#25D366] font-bold text-sm group-hover:underline mt-auto">+91 8101 206 698 →</p>
            </a>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-7" style={{ boxShadow: "var(--shadow-card)" }}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4A017] mb-4">
                <MapPin className="h-6 w-6 text-[#0B1F4D]" />
              </span>
              <h2 className="font-bold text-[#0B1F4D] text-lg mb-1">Location</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                IIFR Lab, Institute of Engineering &amp; Management<br />
                Kolkata, West Bengal, India
              </p>
              <p className="text-xs text-slate-400 mt-2">Supported by IEMRF</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-7" style={{ boxShadow: "var(--shadow-card)" }}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B1F4D] mb-4">
                <Mail className="h-6 w-6 text-[#D4A017]" />
              </span>
              <h2 className="font-bold text-[#0B1F4D] text-lg mb-1">Email</h2>
              <p className="text-slate-500 text-sm mb-3">For formal inquiries or bulk orders.</p>
              <p className="text-sm text-slate-400 italic">Business email coming soon — use WhatsApp for now.</p>
            </div>

            <div className="bg-[#0B1F4D] rounded-2xl p-7 flex flex-col justify-between" style={{ boxShadow: "var(--shadow-card)" }}>
              <div>
                <h2 className="font-bold text-white text-lg mb-2">Ready to order?</h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Submit a quote request and we&apos;ll get back to you within 24 hours.
                </p>
              </div>
              <Link href="/quote" id="contact-quote-cta"
                className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C41E2C] text-white font-bold text-sm hover:bg-[#a01824] transition-colors">
                Request a Quote →
              </Link>
            </div>
          </div>

          {/* Meet the Team */}
          <div>
            <div className="text-center mb-8">
              <div className="ribbon-badge inline-flex mb-3">Student Entrepreneurs · IEM Kolkata</div>
              <h2 className="text-2xl font-black text-[#0B1F4D]">Meet the Team</h2>
              <p className="text-slate-500 text-sm mt-1">Powered by passion, precision, and innovation</p>
            </div>

            {/* ── 3×2 Unified Team Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {TEAM.map((member) =>
                member.isFounder ? (
                  /* Founder card — dark navy treatment */
                  <div
                    key={member.name}
                    className="relative bg-[#0B1F4D] rounded-2xl p-5 flex flex-col gap-3 overflow-hidden"
                    style={{ boxShadow: "0 8px 28px rgba(11,31,77,0.22)" }}
                  >
                    {/* Decorative circle */}
                    <div
                      className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full opacity-10"
                      style={{ background: "#D4A017" }}
                    />
                    {/* Avatar + name row */}
                    <div className="flex items-center gap-3 relative z-10">
                      <div
                        className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0 text-lg font-black"
                        style={{ background: "#D4A017", color: "#0B1F4D" }}
                      >
                        {member.initials}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-black text-white text-sm leading-snug">{member.name}</span>
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: "#D4A017", color: "#0B1F4D" }}
                          >
                            {member.shortRole}
                          </span>
                        </div>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: "#D4A017" }}>
                          {member.fullRole}
                        </p>
                      </div>
                    </div>
                    {/* Expertise */}
                    <p className="text-xs text-slate-400 leading-relaxed relative z-10">{member.expertise}</p>
                    {/* Phone */}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#D4A017] transition-colors relative z-10"
                      >
                        <span
                          className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(212,160,23,0.18)" }}
                        >
                          <Phone className="h-3 w-3" style={{ color: "#D4A017" }} />
                        </span>
                        {member.phone}
                      </a>
                    )}
                    {/* Tagline */}
                    <div className="flex items-center gap-1 relative z-10">
                      <Star className="h-3 w-3 fill-[#D4A017] text-[#D4A017]" />
                      <span className="text-[10px] font-bold tracking-wide" style={{ color: "#D4A017" }}>
                        Founder · Visionary · Builder
                      </span>
                    </div>
                  </div>
                ) : (
                  /* C-Suite card — white with accent left border */
                  <div
                    key={member.name}
                    className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex flex-col gap-3"
                    style={{
                      boxShadow: "var(--shadow-card)",
                      borderLeft: `4px solid ${member.accent}`,
                    }}
                  >
                    {/* Avatar + name row */}
                    <div className="flex items-center gap-3">
                      <div
                        className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0 text-base font-black"
                        style={{ background: `${member.accent}18`, color: member.accent }}
                      >
                        {member.initials}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-black text-[#0B1F4D] text-sm leading-snug">{member.name}</span>
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: `${member.accent}18`, color: member.accent }}
                          >
                            {member.shortRole}
                          </span>
                        </div>
                        <p className="text-xs font-semibold mt-0.5" style={{ color: member.accent }}>
                          {member.fullRole}
                        </p>
                      </div>
                    </div>
                    {/* Expertise */}
                    <p className="text-xs text-slate-500 leading-relaxed">{member.expertise}</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Mentors */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-7" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="font-black text-[#0B1F4D] text-lg mb-5">Our Mentors</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {MENTORS.map((m) => (
                <div key={m.name} className="text-center p-4 bg-[#f8f9fb] rounded-xl border border-[#e2e8f0]">
                  <div className="h-12 w-12 rounded-full bg-[#0B1F4D] flex items-center justify-center mx-auto mb-3">
                    <span className="text-[#D4A017] font-black text-lg">
                      {m.name.split(" ").find((w) => /^[A-Z]/.test(w) && w.length > 2)?.[0] || m.name[0]}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#0B1F4D] leading-snug">{m.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{m.role}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
