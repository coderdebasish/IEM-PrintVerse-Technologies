"use client";

import { useEffect, useState } from "react";

export function InteractiveEffects() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if device supports hover
    const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (hasCoarsePointer) return;

    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      // Find all elements with dynamic mouse interactive effects
      const elements = document.querySelectorAll(
        ".card-hover, .bg-\\[\\#0B1F4D\\], .bg-\\[\\#0b1f4d\\], .bg-hero-gradient, .bg-pricing-gradient, footer, [data-interactive-card]"
      );

      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const rect = htmlEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        htmlEl.style.setProperty("--mouse-x", `${x}px`);
        htmlEl.style.setProperty("--mouse-y", `${y}px`);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <style jsx global>{`
      /* ── 1. Spotlight effect for dark sections (Footer, Hero, Pricing) ── */
      .bg-\\[\\#0B1F4D\\],
      .bg-\\[\\#0b1f4d\\],
      .bg-hero-gradient,
      .bg-pricing-gradient,
      footer {
        position: relative;
        overflow: hidden;
      }

      .bg-\\[\\#0B1F4D\\]::before,
      .bg-\\[\\#0b1f4d\\]::before,
      .bg-hero-gradient::before,
      .bg-pricing-gradient::before,
      footer::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: radial-gradient(
          800px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px),
          rgba(212, 160, 23, 0.08) 0%,
          rgba(196, 30, 44, 0.04) 40%,
          transparent 80%
        );
        opacity: 0;
        transition: opacity 0.5s ease-out;
        z-index: 0;
      }

      .bg-\\[\\#0B1F4D\\]:hover::before,
      .bg-\\[\\#0b1f4d\\]:hover::before,
      .bg-hero-gradient:hover::before,
      .bg-pricing-gradient:hover::before,
      footer:hover::before {
        opacity: 1;
      }

      /* Ensure actual content sits above the spotlight background layer */
      .bg-\\[\\#0B1F4D\\] > *,
      .bg-\\[\\#0b1f4d\\] > *,
      .bg-hero-gradient > *,
      .bg-pricing-gradient > *,
      footer > *,
      .interactive-spotlight > * {
        position: relative;
        z-index: 1;
      }

      /* ── 2. Subtle Mouse Spotlight reflection inside light Cards (card-hover) ── */
      .card-hover {
        position: relative;
        overflow: hidden;
      }

      .card-hover::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: radial-gradient(
          350px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px),
          rgba(212, 160, 23, 0.06) 0%,
          rgba(196, 30, 44, 0.02) 50%,
          transparent 100%
        );
        opacity: 0;
        transition: opacity 0.4s ease-out;
        z-index: 1;
      }

      .card-hover:hover::before {
        opacity: 1;
      }
    `}</style>
  );
}
