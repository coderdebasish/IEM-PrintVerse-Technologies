"use client";

import { useEffect, useState } from "react";

export function InteractiveEffects() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Smooth trail calculation (Linear interpolation for smooth lagging transition)
  useEffect(() => {
    let animFrame: number;
    const updateTrail = () => {
      setTrailPos((prev) => {
        const dx = mousePos.x - prev.x;
        const dy = mousePos.y - prev.y;
        return {
          x: prev.x + dx * 0.15,
          y: prev.y + dy * 0.15,
        };
      });
      animFrame = requestAnimationFrame(updateTrail);
    };
    animFrame = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(animFrame);
  }, [mousePos]);

  useEffect(() => {
    // Check if device supports hover (coarse pointers like touch screens don't)
    const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (hasCoarsePointer) return;

    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Target all dark blue, brand gradient, or custom spotlight elements
      const spotlightElements = document.querySelectorAll(
        ".interactive-spotlight, .bg-\\[\\#0B1F4D\\], .bg-hero-gradient, .bg-pricing-gradient, footer, .bg-\\[\\#0b1f4d\\]"
      );

      spotlightElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const rect = htmlEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        htmlEl.style.setProperty("--mouse-x", `${x}px`);
        htmlEl.style.setProperty("--mouse-y", `${y}px`);
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isClickable =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("card-hover") ||
        target.closest(".card-hover") ||
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "LABEL" ||
        target.style.cursor === "pointer";

      setIsHoveringClickable(!!isClickable);
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);
    const handleMouseLeaveWindow = () => setIsVisible(false);
    const handleMouseEnterWindow = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeaveWindow);
    document.addEventListener("mouseenter", handleMouseEnterWindow);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeaveWindow);
      document.removeEventListener("mouseenter", handleMouseEnterWindow);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <style jsx global>{`
        /* Global Spotlight effect for dark backgrounds */
        .bg-\\[\\#0B1F4D\\],
        .bg-\\[\\#0b1f4d\\],
        .bg-hero-gradient,
        .bg-pricing-gradient,
        footer,
        .interactive-spotlight {
          position: relative;
          overflow: hidden;
        }

        .bg-\\[\\#0B1F4D\\]::before,
        .bg-\\[\\#0b1f4d\\]::before,
        .bg-hero-gradient::before,
        .bg-pricing-gradient::before,
        footer::before,
        .interactive-spotlight::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            600px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px),
            rgba(212, 160, 23, 0.07) 0%,
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
        footer:hover::before,
        .interactive-spotlight:hover::before {
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

        /* Smooth Custom Cursor Styles */
        .custom-cursor-aura {
          position: fixed;
          top: 0;
          left: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2.5px solid #D4A017;
          background-color: transparent;
          pointer-events: none;
          z-index: 99999;
          transform: translate(-50%, -50%);
          transition: width 0.25s, height 0.25s, background-color 0.25s, border-color 0.25s;
        }

        .custom-cursor-dot {
          position: fixed;
          top: 0;
          left: 0;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #C41E2C;
          pointer-events: none;
          z-index: 100000;
          transform: translate(-50%, -50%);
          transition: background-color 0.25s;
        }
      `}</style>

      {/* Trailing Aura Ring */}
      <div
        className="custom-cursor-aura hidden md:block"
        style={{
          left: `${trailPos.x}px`,
          top: `${trailPos.y}px`,
          borderColor: isHoveringClickable ? "#C41E2C" : "#D4A017",
          backgroundColor: isHoveringClickable ? "rgba(196, 30, 44, 0.06)" : "transparent",
          transform: `translate(-50%, -50%) scale(${isMouseDown ? 0.75 : isHoveringClickable ? 1.4 : 1})`,
          boxShadow: isHoveringClickable ? "0 0 16px rgba(196, 30, 44, 0.3)" : "none",
        }}
      />

      {/* Lead Dot */}
      <div
        className="custom-cursor-dot hidden md:block"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
          backgroundColor: isHoveringClickable ? "#D4A017" : "#C41E2C",
        }}
      />
    </>
  );
}
