import type { Metadata } from "next";
import Link from "next/link";
import {
  Printer,
  Zap,
  Shield,
  Clock,
  Star,
  ChevronRight,
  Package,
  MessageSquare,
  Truck,
  CheckCircle2,
  ArrowRight,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "PrintVerse Technologies — Where Every Idea Takes Shape",
  description:
    "Premium 3D printing at a flat ₹4/gram. Custom designs, heritage replicas, gifts, engineering prototypes. Powered by IIFR Lab, IEM Kolkata.",
};

/* ── Data ─────────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  {
    name: "Heritage & Cultural",
    icon: "🏛️",
    desc: "Iconic Indian monuments, cultural replicas, and historical artefacts.",
    slug: "Heritage",
  },
  {
    name: "Personalized Gifts",
    icon: "🎁",
    desc: "Custom name plates, portrait busts, and keepsake collectibles.",
    slug: "Gift",
  },
  {
    name: "Home Décor",
    icon: "🏠",
    desc: "Vases, wall art, planters, and architectural models.",
    slug: "Home",
  },
  {
    name: "Kids & Education",
    icon: "🎓",
    desc: "Learning models, puzzles, toys, and STEM project aids.",
    slug: "Kids",
  },
  {
    name: "Office & Desk",
    icon: "💼",
    desc: "Organisers, awards, name plates, and custom accessories.",
    slug: "Office",
  },
  {
    name: "Engineering",
    icon: "⚙️",
    desc: "Functional prototypes, brackets, jigs, and technical parts.",
    slug: "Engineering",
  },
];

const WHY_US = [
  {
    icon: Zap,
    title: "Flat ₹4 / gram",
    desc: "No hidden fees. One transparent price for every order — big or small.",
  },
  {
    icon: Shield,
    title: "Lab-Grade Quality",
    desc: "Powered by IIFR Lab, IEM Kolkata with professional-grade FDM printers.",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    desc: "Most orders shipped within 3–5 working days from confirmation.",
  },
  {
    icon: Star,
    title: "Fully Custom",
    desc: "Upload your STL or describe your idea — we'll bring it to life.",
  },
];

const STEPS = [
  {
    no: "01",
    icon: MessageSquare,
    title: "Request a Quote",
    desc: "Fill out our quick form or upload your STL file with preferences.",
  },
  {
    no: "02",
    icon: Printer,
    title: "We Review & Price",
    desc: "Our team reviews your design and sends a detailed quote within 24 hrs.",
  },
  {
    no: "03",
    icon: Package,
    title: "Confirm & Pay",
    desc: "Approve the quote, pay securely via Razorpay, and we start printing.",
  },
  {
    no: "04",
    icon: Truck,
    title: "Delivered to You",
    desc: "Your finished print is carefully packaged and shipped to your door.",
  },
];

const TESTIMONIALS = [
  {
    name: "Arnab Saha",
    role: "Mechanical Engineering Student",
    text: "Ordered a custom bracket prototype for my final-year project. The finish was flawless and it arrived in 4 days. Absolutely love the quality!",
    rating: 5,
  },
  {
    name: "Priya Chatterjee",
    role: "Interior Designer",
    text: "Got a miniature replica of Howrah Bridge as a décor piece. The detail is incredible. PrintVerse is my go-to for unique gifts now.",
    rating: 5,
  },
  {
    name: "Rahul Gupta",
    role: "Startup Founder",
    text: "Needed 20 custom logo stands for a product launch. Pricing was transparent, turnaround was fast, and the quality was premium.",
    rating: 5,
  },
];

/* ── Component ────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative overflow-hidden bg-hero-gradient text-white"
        style={{ minHeight: "88vh" }}
      >
        {/* Decorative grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glowing blobs */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, #C41E2C 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 -left-24 w-80 h-80 rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, #D4A017 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="ribbon-badge mb-8">
            <Layers className="h-3.5 w-3.5" />
            Powered by IIFR Lab · IEM Kolkata
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white max-w-4xl">
            Where Every Idea{" "}
            <span
              className="relative inline-block"
              style={{ color: "#D4A017" }}
            >
              Takes Shape
              <span
                className="absolute -bottom-1 left-0 w-full h-1 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #D4A017, #f0c040, #D4A017)",
                }}
              />
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
            Professional 3D printing at a flat{" "}
            <span className="text-[#D4A017] font-bold">₹4/gram</span>. Upload
            your design or choose from our catalog — we handle the rest.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/quote"
              id="hero-cta-quote"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#C41E2C] text-white font-bold text-base hover:bg-[#a01824] transition-all duration-200 shadow-lg hover:shadow-[0_8px_30px_rgba(196,30,44,0.45)] animate-pulse-glow"
            >
              Request a Free Quote
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/products"
              id="hero-cta-products"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-bold text-base hover:bg-white/10 hover:border-white/60 transition-all duration-200"
            >
              Browse Products
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Trust stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 sm:gap-16 text-center">
            {[
              { val: "₹4", label: "Per Gram" },
              { val: "50g+", label: "Minimum Order" },
              { val: "100%", label: "Custom Made" },
            ].map(({ val, label }) => (
              <div key={label}>
                <p
                  className="text-3xl sm:text-4xl font-black"
                  style={{ color: "#D4A017" }}
                >
                  {val}
                </p>
                <p className="text-slate-400 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why PrintVerse ───────────────────────────────────────────────── */}
      <section id="why-us" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-[#C41E2C] font-bold text-sm uppercase tracking-widest mb-2">
              Why Choose Us
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F4D]">
              Printing You Can Trust
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {WHY_US.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="card-hover rounded-2xl p-7 border border-[#e2e8f0] bg-[#f8f9fb] flex flex-col items-start gap-4"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B1F4D]">
                  <Icon className="h-6 w-6 text-[#D4A017]" />
                </span>
                <h3 className="font-bold text-[#0B1F4D] text-lg">{title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section id="categories" className="section-padding bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-[#C41E2C] font-bold text-sm uppercase tracking-widest mb-2">
              Our Catalog
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F4D]">
              Shop by Category
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map(({ name, icon, desc, slug }) => (
              <Link
                key={slug}
                href={`/products?category=${slug}`}
                id={`category-${slug.toLowerCase()}`}
                className="group card-hover rounded-2xl p-7 bg-white border border-[#e2e8f0] flex flex-col gap-3"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <span className="text-4xl">{icon}</span>
                <h3 className="font-bold text-[#0B1F4D] text-lg group-hover:text-[#C41E2C] transition-colors">
                  {name}
                </h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{desc}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-[#C41E2C] text-sm font-semibold">
                  View Products <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/products"
              id="all-products-link"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#0B1F4D] text-white font-bold hover:bg-[#1a3a7a] transition-colors"
            >
              View All Products <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing Banner ───────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="bg-pricing-gradient text-white py-20 overflow-hidden relative"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/70 font-bold text-sm uppercase tracking-widest mb-3">
            Simple Pricing
          </p>
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Just{" "}
            <span className="text-[#D4A017]" style={{ fontSize: "3.5rem" }}>
              ₹4
            </span>{" "}
            per gram
          </h2>
          <p className="text-white/80 text-lg mb-2">
            Minimum order: 50 grams (₹200). No setup fees. No surprises.
          </p>
          <p className="text-white/60 text-sm mb-10">
            Delivery charges calculated at checkout based on pincode.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote"
              id="pricing-cta-quote"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#C41E2C] font-black hover:bg-[#f8f9fb] transition-colors shadow-lg"
            >
              Get My Quote <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/products"
              id="pricing-cta-products"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/40 text-white font-bold hover:bg-white/10 transition-colors"
            >
              Shop Catalog <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-[#C41E2C] font-bold text-sm uppercase tracking-widest mb-2">
              The Process
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F4D]">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(({ no, icon: Icon, title, desc }, idx) => (
              <div key={no} className="relative flex flex-col items-center text-center gap-4">
                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-0.5 bg-gradient-to-r from-[#e2e8f0] to-[#0B1F4D]/20" />
                )}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B1F4D] shadow-lg">
                  <Icon className="h-7 w-7 text-[#D4A017]" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#C41E2C] text-white text-xs font-black">
                    {no.slice(-1)}
                  </span>
                </div>
                <h3 className="font-bold text-[#0B1F4D] text-base">{title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/quote"
              id="how-it-works-cta"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#C41E2C] text-white font-bold hover:bg-[#a01824] transition-colors shadow-md"
            >
              Start My Order <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="section-padding bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-[#C41E2C] font-bold text-sm uppercase tracking-widest mb-2">
              What Customers Say
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F4D]">
              Trusted by Makers & Dreamers
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(({ name, role, text, rating }) => (
              <div
                key={name}
                className="rounded-2xl p-7 bg-white border border-[#e2e8f0] flex flex-col gap-4"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-[#D4A017] text-[#D4A017]"
                    />
                  ))}
                </div>
                <p className="text-[#0B1F4D] text-sm leading-relaxed flex-1 italic">
                  "{text}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-[#e2e8f0]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B1F4D] text-white font-bold text-sm">
                    {name[0]}
                  </span>
                  <div>
                    <p className="font-bold text-[#0B1F4D] text-sm">{name}</p>
                    <p className="text-[#64748b] text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section
        id="cta"
        className="section-padding bg-hero-gradient text-white relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#D4A017] mb-6" />
          <h2 className="text-3xl sm:text-4xl font-black mb-4 text-white">
            Ready to Build Something Real?
          </h2>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed">
            Whether it's a prototype, a gift, or a passion project — PrintVerse
            brings your ideas off the screen and into your hands.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote"
              id="final-cta-quote"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#C41E2C] text-white font-black hover:bg-[#a01824] transition-all shadow-lg hover:shadow-[0_8px_30px_rgba(196,30,44,0.5)]"
            >
              Request a Quote <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/track"
              id="final-cta-track"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-bold hover:bg-white/10 transition-colors"
            >
              Track My Order <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
