"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Printer } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/quote", label: "Request Quote" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 bg-white"
      style={{ boxShadow: "var(--shadow-nav)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            onClick={() => setIsOpen(false)}
          >
            <div className="relative h-10 w-48">
              <Image
                src="/logo.png"
                alt="PrintVerse Technologies"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150",
                    isActive
                      ? "bg-[#0B1F4D] text-white"
                      : "text-[#0B1F4D] hover:bg-[#0B1F4D]/8",
                  ].join(" ")}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href="/quote"
              className="ml-3 px-5 py-2 rounded-xl bg-[#C41E2C] text-white font-semibold text-sm hover:bg-[#a01824] transition-colors shadow-sm"
            >
              Get a Quote
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-[#0B1F4D] hover:bg-[#0B1F4D]/8 transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-[#e2e8f0] mt-0 pt-3 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={[
                      "px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-[#0B1F4D] text-white"
                        : "text-[#0B1F4D] hover:bg-[#0B1F4D]/8",
                    ].join(" ")}
                  >
                    {label}
                  </Link>
                );
              })}
              <Link
                href="/quote"
                onClick={() => setIsOpen(false)}
                className="mt-2 px-4 py-2.5 rounded-xl bg-[#C41E2C] text-white font-semibold text-sm text-center hover:bg-[#a01824] transition-colors"
              >
                Get a Quote
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
