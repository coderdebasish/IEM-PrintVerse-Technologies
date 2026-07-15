"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Layers } from "lucide-react";

export function InteractiveHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized offset between -1 and 1 relative to center
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const offsetX = (x - centerX) / centerX;
    const offsetY = (y - centerY) / centerY;

    setMousePos({ x, y });
    setOffset({ x: offsetX, y: offsetY });
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setOffset({ x: 0, y: 0 });
      }}
      className="relative overflow-hidden bg-hero-gradient text-white select-none transition-colors duration-500"
      style={{ minHeight: "88vh" }}
    >
      {/* CSS Floating Animations */}
      <style jsx global>{`
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(8deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-6deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        .animate-float-slow-1 {
          animation: float-1 8s ease-in-out infinite;
        }
        .animate-float-slow-2 {
          animation: float-2 10s ease-in-out infinite;
        }
        .animate-float-slow-3 {
          animation: float-3 9s ease-in-out infinite;
        }
      `}</style>

      {/* Parallax Grid Overlay */}
      <div
        className="absolute inset-0 opacity-15 transition-transform duration-300 ease-out pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          transform: `translate(${offset.x * 12}px, ${offset.y * 12}px) scale(1.02)`,
        }}
      />

      {/* Spotlight following the mouse cursor */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 160, 23, 0.12) 0%, rgba(196, 30, 44, 0.08) 40%, transparent 80%)`,
        }}
      />

      {/* Static corner ambient lights */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-25 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #C41E2C 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 -left-24 w-80 h-80 rounded-full opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #D4A017 0%, transparent 70%)",
        }}
      />

      {/* Floating 3D Print-themed vector graphics (swaying with cursor parallax) */}
      <div
        className="absolute left-[8%] top-[22%] opacity-20 pointer-events-none hidden md:block transition-transform duration-500 ease-out animate-float-slow-1"
        style={{
          transform: `translate(${offset.x * -25}px, ${offset.y * -25}px)`,
        }}
      >
        <svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#D4A017" strokeWidth="2" strokeDasharray="3 3">
          <path d="M50 10 L90 35 L90 75 L50 95 L10 75 L10 35 Z" />
          <path d="M50 10 L50 95" />
          <path d="M10 35 L50 55 L90 35" />
          <circle cx="50" cy="55" r="5" fill="#D4A017" />
        </svg>
      </div>

      <div
        className="absolute right-[8%] top-[28%] opacity-25 pointer-events-none hidden md:block transition-transform duration-500 ease-out animate-float-slow-2"
        style={{
          transform: `translate(${offset.x * -35}px, ${offset.y * -35}px)`,
        }}
      >
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#C41E2C" strokeWidth="2.5">
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="25" strokeWidth="1.5" strokeDasharray="4 2" />
          <path d="M50 10 L50 90 M10 50 L90 50" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      <div
        className="absolute left-[12%] bottom-[20%] opacity-15 pointer-events-none hidden md:block transition-transform duration-500 ease-out animate-float-slow-3"
        style={{
          transform: `translate(${offset.x * -20}px, ${offset.y * -20}px)`,
        }}
      >
        <svg width="90" height="70" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="white" strokeWidth="2">
          {/* 3D printer layered printing visualizer */}
          <path d="M10 80 L110 80 M20 65 L100 65 M30 50 L90 50 M45 35 L75 35" strokeDasharray="2 1" />
          <path d="M60 10 L60 30" strokeLinecap="round" />
          <path d="M52 30 L68 30 L60 35 Z" fill="white" />
        </svg>
      </div>

      {/* Main Content Container with Staggered Slide Up */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36 flex flex-col items-center text-center">
        {/* Ribbon Badge */}
        <div
          className={`ribbon-badge mb-8 transition-all duration-700 delay-100 ${
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Powered by IIFR Lab · IEM Kolkata
        </div>

        {/* Title */}
        <h1
          className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white max-w-4xl transition-all duration-700 delay-200 ${
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Where Every Idea{" "}
          <span className="relative inline-block text-[#D4A017] group">
            Takes Shape
            <span
              className="absolute -bottom-1 left-0 w-full h-1 rounded-full bg-gradient-to-r from-[#D4A017] via-[#f0c040] to-[#D4A017]"
              style={{
                background: "linear-gradient(90deg, #D4A017, #f0c040, #D4A017)",
              }}
            />
          </span>
        </h1>

        {/* Description text */}
        <p
          className={`mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed transition-all duration-700 delay-300 ${
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Professional 3D printing at a flat{" "}
          <span className="text-[#D4A017] font-bold">₹4/gram</span>. Upload your
          design or choose from our catalog — we handle the rest.
        </p>

        {/* CTA Buttons */}
        <div
          className={`mt-10 flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-400 ${
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
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
        <div
          className={`mt-16 grid grid-cols-3 gap-8 sm:gap-16 text-center transition-all duration-700 delay-500 ${
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {[
            { val: "₹4", label: "Per Gram" },
            { val: "50g+", label: "Minimum Order" },
            { val: "100%", label: "Custom Made" },
          ].map(({ val, label }) => (
            <div key={label} className="group cursor-default">
              <p
                className="text-3xl sm:text-4xl font-black transition-transform duration-300 group-hover:scale-110"
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
  );
}
