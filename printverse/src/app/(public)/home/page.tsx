import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
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
import { InteractiveHero } from "./InteractiveHero";

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

export default async function HomePage() {
  const service = createServiceClient();
  const { data: dbFeedback } = await service
    .from("feedback")
    .select("customer_name, rating, title, message")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(6);

  const testimonials = [
    ...(dbFeedback?.map((f: { customer_name: string; rating: number; title: string | null; message: string }) => ({
      name: f.customer_name,
      role: "Verified Customer",
      text: f.message,
      rating: f.rating
    })) || []),
    ...TESTIMONIALS
  ].slice(0, 6);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <InteractiveHero />

      {/* ── Why PrintVerse ───────────────────────────────────────────────── */}
      <section id="why-us" className="section-padding bg-gradient-to-b from-[#ffffff] to-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#C41E2C] font-bold text-sm uppercase tracking-widest mb-2">
              Why Choose Us
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F4D]">
              Premium 3D Printing, Simplified
            </h2>
            <div className="h-1 w-16 bg-[#D4A017] mx-auto mt-4 rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map(({ icon: Icon, title, desc }, idx) => {
              // Accent colors for each why-us card to create a premium feel
              const colors = [
                { border: "hover:border-[#D4A017]", iconBg: "bg-[#D4A017]/10", iconColor: "text-[#D4A017]" },
                { border: "hover:border-[#7C3AED]", iconBg: "bg-[#7C3AED]/10", iconColor: "text-[#7C3AED]" },
                { border: "hover:border-[#0891B2]", iconBg: "bg-[#0891B2]/10", iconColor: "text-[#0891B2]" },
                { border: "hover:border-[#C41E2C]", iconBg: "bg-[#C41E2C]/10", iconColor: "text-[#C41E2C]" }
              ];
              const style = colors[idx % colors.length];
              return (
                <div
                  key={title}
                  className={`group card-hover rounded-2xl p-8 border border-[#e2e8f0] bg-white flex flex-col items-start gap-5 transition-all duration-300 ${style.border}`}
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`h-7 w-7 ${style.iconColor}`} />
                  </span>
                  <div>
                    <h3 className="font-black text-[#0B1F4D] text-lg group-hover:text-[#0B1F4D]/90">{title}</h3>
                    <p className="text-[#64748b] text-sm leading-relaxed mt-2">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section id="categories" className="section-padding bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#C41E2C] font-bold text-sm uppercase tracking-widest mb-2">
              Our Catalog
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F4D]">
              Explore by Category
            </h2>
            <div className="h-1 w-16 bg-[#C41E2C] mx-auto mt-4 rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map(({ name, icon, desc, slug }) => (
              <Link
                key={slug}
                href={`/products?category=${slug}`}
                id={`category-${slug.toLowerCase()}`}
                className="group card-hover rounded-2xl p-8 bg-white border border-[#e2e8f0] flex flex-col gap-4 hover:border-[#D4A017]/30 transition-all duration-300"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="h-14 w-14 rounded-2xl bg-[#0B1F4D]/5 flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110 shrink-0">
                  {icon}
                </div>
                <div>
                  <h3 className="font-black text-[#0B1F4D] text-lg group-hover:text-[#C41E2C] transition-colors">
                    {name}
                  </h3>
                  <p className="text-[#64748b] text-sm leading-relaxed mt-2">{desc}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-[#C41E2C] text-sm font-bold pt-2">
                  View Products{" "}
                  <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/products"
              id="all-products-link"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#0B1F4D] text-white font-black hover:bg-[#1a3a7a] transition-all shadow-md hover:shadow-lg"
            >
              View All Products <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing Banner ───────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="bg-pricing-gradient text-white py-24 overflow-hidden relative"
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
            {/* Glow accent */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#D4A017]/30 blur-3xl pointer-events-none" />
            
            <p className="text-white/80 font-bold text-sm uppercase tracking-widest mb-3">
              Simple & Transparent Pricing
            </p>
            
            <h2 className="text-4xl sm:text-6xl font-black mb-6 leading-tight">
              Just{" "}
              <span className="text-[#D4A017] inline-block font-black relative px-4 drop-shadow-[0_2px_15px_rgba(212,160,23,0.3)]">
                ₹4
              </span>{" "}
              per gram
            </h2>
            
            <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8 font-semibold">
              Minimum order: 50 grams (₹200). No setup fees. No hidden costs.
            </p>

            {/* Checkmark benefits grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10 text-left border-t border-white/10 pt-8">
              {[
                "Flat rate ₹4/g pricing",
                "Zero machine setup fee",
                "Industrial-grade quality",
                "Secure Razorpay checkout"
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-white/90 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4 text-[#D4A017] shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <p className="text-white/60 text-xs mb-8">
              Delivery charges calculated at checkout based on delivery location pincode.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote"
                id="pricing-cta-quote"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#C41E2C] font-black hover:bg-slate-100 transition-all shadow-lg hover:shadow-[0_8px_20px_rgba(255,255,255,0.15)]"
              >
                Get My Quote <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/products"
                id="pricing-cta-products"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-bold hover:bg-white/10 hover:border-white/60 transition-colors"
              >
                Shop Catalog <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#C41E2C] font-bold text-sm uppercase tracking-widest mb-2">
              The Process
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F4D]">
              How It Works
            </h2>
            <div className="h-1 w-16 bg-[#D4A017] mx-auto mt-4 rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ no, icon: Icon, title, desc }, idx) => (
              <div 
                key={no} 
                className="group relative flex flex-col items-start p-7 bg-[#f8f9fb] border border-[#e2e8f0] rounded-2xl card-hover transition-all duration-300"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {/* Connector line (large screens) */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(100%-1rem)] w-8 h-0.5 bg-gradient-to-r from-[#e2e8f0] to-[#0B1F4D]/20 z-10" />
                )}
                
                {/* Background Large Faded Number */}
                <span className="absolute right-6 top-4 text-5xl font-black text-slate-200/50 select-none group-hover:text-[#D4A017]/20 transition-colors">
                  {no}
                </span>

                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl bg-[#0B1F4D] shadow-md group-hover:scale-105 transition-transform duration-300">
                  <Icon className="h-6 w-6 text-[#D4A017]" />
                </div>
                
                <h3 className="font-black text-[#0B1F4D] text-lg mt-6">{title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed mt-2">{desc}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link
              href="/quote"
              id="how-it-works-cta"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#C41E2C] text-white font-black hover:bg-[#a01824] transition-all shadow-md hover:shadow-lg"
            >
              Start My Order <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="section-padding bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#C41E2C] font-bold text-sm uppercase tracking-widest mb-2">
              What Customers Say
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F4D]">
              Trusted by Makers & Creators
            </h2>
            <div className="h-1 w-16 bg-[#C41E2C] mx-auto mt-4 rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map(({ name, role, text, rating }) => (
              <div
                key={name}
                className="group relative rounded-2xl p-8 bg-white border border-[#e2e8f0] flex flex-col gap-5 card-hover hover:border-[#D4A017]/20 transition-all duration-300"
                style={{ boxShadow: "var(--shadow-card)", borderLeft: "4px solid #D4A017" }}
              >
                {/* Background quotes mark */}
                <div className="absolute right-6 top-4 text-7xl font-black text-slate-100 select-none pointer-events-none group-hover:text-[#D4A017]/10 transition-colors">
                  “
                </div>

                <div className="flex gap-1 relative z-10">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-[#D4A017] text-[#D4A017]"
                    />
                  ))}
                </div>
                
                <p className="text-[#0B1F4D] text-sm leading-relaxed flex-1 italic relative z-10">
                  "{text}"
                </p>
                
                <div className="flex items-center gap-3 pt-4 border-t border-[#e2e8f0] relative z-10">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B1F4D] text-[#D4A017] font-black text-base shadow-sm">
                    {name[0]}
                  </span>
                  <div>
                    <p className="font-black text-[#0B1F4D] text-sm leading-snug">{name}</p>
                    <p className="text-[#64748b] text-xs font-semibold mt-0.5">{role}</p>
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
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <CheckCircle2 className="mx-auto h-16 w-16 text-[#D4A017] mb-6 drop-shadow-[0_2px_10px_rgba(212,160,23,0.3)] animate-bounce" style={{ animationDuration: '3s' }} />
          <h2 className="text-3xl sm:text-5xl font-black mb-6 text-white leading-tight">
            Ready to Build Something Real?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
            Whether it's a high-precision engineering prototype, a custom cultural gift, or a personal passion project — PrintVerse brings your ideas off the screen and into your hands.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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

