import Link from "next/link";
import { Printer, MapPin, Phone, Mail } from "lucide-react";

const MENTORS = [
  "Mr. Diptiman Dasgupta",
  "Dr. Prabir Kumar Das",
  "Dr. Chandan Adhikari",
  "Dr. Ranabir Banik",
];

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/quote", label: "Request Quote" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact Us" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0B1F4D] text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="h-7 w-7 text-[#D4A017]" />
              <span className="font-black text-2xl tracking-tight">
                Print<span className="text-[#C41E2C]">Verse</span>{" "}
                <span className="text-slate-300 font-light text-lg">Technologies</span>
              </span>
            </div>
            <p className="text-[#D4A017] font-semibold italic mb-2">
              "Where Every Idea Takes Shape."
            </p>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Your Imagination • Our Technology • Infinite Possibilities
            </p>
            <p className="text-xs text-slate-400 mb-2">
              Flat pricing: <span className="text-[#D4A017] font-bold">₹4/gram</span> for all 3D printed products. 50g minimum.
            </p>

            {/* Social placeholders — real links to be provided */}
            <div className="flex gap-3 mt-4">
              {/* SCAFFOLD: Real social links to be supplied by client */}
              {[
                { label: "WhatsApp", href: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918101206698"}` },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-[#D4A017] transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-5">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-300 hover:text-white text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Powered by / Mentors */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#D4A017] mb-5">
              Supported By
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-white font-semibold text-sm">IIFR Lab</p>
                <p className="text-slate-400 text-xs">IEM Kolkata</p>
                <p className="text-slate-400 text-xs">Supported by IEMRF</p>
              </div>
              <div>
                <p className="text-slate-300 text-xs font-semibold mb-1">Mentors</p>
                <ul className="space-y-1">
                  {MENTORS.map((mentor) => (
                    <li key={mentor} className="text-slate-400 text-xs">
                      {mentor}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-400 text-xs text-center sm:text-left">
            © {year} PrintVerse Technologies. All rights reserved.
          </p>
          <p className="text-slate-500 text-xs text-center sm:text-right">
            Powered by{" "}
            <span className="text-[#D4A017]">IIFR Lab, IEM Kolkata</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
