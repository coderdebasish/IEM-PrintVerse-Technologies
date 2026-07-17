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
    role: "CEO Founder & Lead Developer",
    expertise: "3D Printing Technology · Business Strategy",
    phone: "+91 8101 206 698",
    initials: "DM",
    highlight: true,
  },
  {
    name: "Sounak Chakraborty",
    role: "CAD Design Expert",
    expertise: "3D Modelling · Product Design",
    initials: "SC",
    highlight: false,
  },
  {
    name: "Suchona Saha",
    role: "CAD Design Expert",
    expertise: "3D Modelling · Creative Design",
    initials: "SS",
    highlight: false,
  },
  {
    name: "Aitihya Mondal",
    role: "CAD Design Expert",
    expertise: "3D Modelling · Prototype Engineering",
    initials: "AM",
    highlight: false,
  },
  {
    name: "Soumik Nath",
    role: "CAD Design Expert",
    expertise: "3D Modelling · Technical Design",
    initials: "SN",
    highlight: false,
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

          {/* Student Entrepreneurs */}
          <div>
            <div className="text-center mb-6">
              <div className="ribbon-badge inline-flex mb-3">Student Entrepreneurs · IEM Kolkata</div>
              <h2 className="text-2xl font-black text-[#0B1F4D]">Meet the Team</h2>
              <p className="text-slate-500 text-sm mt-1">Powered by passion, precision, and innovation</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {TEAM.map((member) => (
                <div key={member.name}
                  className={[
                    "bg-white rounded-2xl border p-6 flex flex-col gap-4",
                    member.highlight ? "border-[#D4A017] ring-2 ring-[#D4A017]/20" : "border-[#e2e8f0]",
                  ].join(" ")}
                  style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-center gap-4">
                    <div className={[
                      "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 text-lg font-black",
                      member.highlight ? "bg-[#D4A017] text-[#0B1F4D]" : "bg-[#0B1F4D] text-[#D4A017]",
                    ].join(" ")}>
                      {member.initials}
                    </div>
                    <div>
                      <p className="font-black text-[#0B1F4D] text-sm leading-snug">{member.name}</p>
                      <p className="text-xs text-[#C41E2C] font-semibold mt-0.5">{member.role}</p>
                      {member.highlight && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="h-3 w-3 fill-[#D4A017] text-[#D4A017]" />
                          <span className="text-xs text-[#D4A017] font-bold">Founder</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1">{member.expertise}</p>
                  {member.phone && (
                    <a href={`tel:${member.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-1.5 text-xs text-[#0B1F4D] font-semibold hover:text-[#C41E2C] transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                      {member.phone}
                    </a>
                  )}
                </div>
              ))}
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
