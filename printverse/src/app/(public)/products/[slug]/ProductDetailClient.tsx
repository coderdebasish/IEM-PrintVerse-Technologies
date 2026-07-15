"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Truck,
  Sparkles,
  Package,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils/helpers";
import type { Product } from "@/types";

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  // Combine single image and multiple images list, removing duplicates
  const images = Array.from(
    new Set(
      [
        product.image_url,
        ...(product.image_urls || []),
      ].filter((url): url is string => typeof url === "string" && url.trim() !== "")
    )
  );

  const [activeImage, setActiveImage] = useState<string | null>(
    images[0] || null
  );

  const activeIndex = activeImage ? images.indexOf(activeImage) : 0;

  // Hover zoom states (Desktop)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);

  // Lightbox state (Mobile)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleNextImage = () => {
    if (images.length <= 1) return;
    const nextIndex = (activeIndex + 1) % images.length;
    setActiveImage(images[nextIndex]);
  };

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    const prevIndex = (activeIndex - 1 + images.length) % images.length;
    setActiveImage(images[prevIndex]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 1024) {
      setIsZoomed(true);
    }
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  const handleImageClick = () => {
    if (window.innerWidth < 1024) {
      setIsLightboxOpen(true);
    } else {
      handleNextImage();
    }
  };

  const isComingSoon = product.is_coming_soon || !product.is_available;
  const categories = product.categories && product.categories.length > 0
    ? product.categories
    : [product.category];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 mb-8">
        <Link
          href="/products"
          className="flex items-center gap-1 hover:text-[#0B1F4D] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Catalog
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-medium truncate">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Product Images Gallery */}
        <div className="lg:col-span-7 space-y-4">
          {activeImage ? (
            <div 
              className="relative aspect-square sm:aspect-[4/3] md:aspect-square w-full bg-[#f8f9fb] rounded-3xl border border-[#e2e8f0] overflow-hidden shadow-sm group select-none"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* Click handler */}
              <div 
                onClick={handleImageClick} 
                className="w-full h-full relative overflow-hidden cursor-zoom-in"
              >
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover transition-transform duration-100 ease-out"
                  style={{
                    transform: isZoomed ? "scale(2.2)" : "scale(1)",
                    transformOrigin: isZoomed ? `${zoomPos.x}% ${zoomPos.y}%` : "center",
                  }}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* Overlay elements (don't show if zoomed to avoid obstructing view) */}
              {!isZoomed && (
                <>
                  {isComingSoon && (
                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                      <span className="text-xs font-bold bg-[#D4A017] text-[#0B1F4D] px-3 py-1 rounded-full shadow">
                        Coming Soon
                      </span>
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 text-[#0B1F4D] shadow-md border border-[#e2e8f0] hover:bg-white hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 text-[#0B1F4D] shadow-md border border-[#e2e8f0] hover:bg-white hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 cursor-pointer"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>

                      {/* Counter badge */}
                      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10 select-none pointer-events-none">
                        {activeIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="relative aspect-square w-full bg-[#f8f9fb] rounded-3xl border border-[#e2e8f0] flex flex-col items-center justify-center text-slate-300">
              <Package className="h-20 w-20 mb-2" />
              <span className="text-sm font-semibold">No Image Available</span>
            </div>
          )}

          {/* Thumbnail list */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {images.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  onClick={() => setActiveImage(url)}
                  className={[
                    "relative h-20 w-20 rounded-xl overflow-hidden border-2 shrink-0 bg-white transition-all cursor-pointer",
                    activeImage === url
                      ? "border-[#0B1F4D] scale-95 shadow-sm"
                      : "border-[#e2e8f0] hover:border-slate-400"
                  ].join(" ")}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Category Badges */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="text-xs font-bold bg-[#0B1F4D]/5 text-[#0B1F4D] px-3 py-1 rounded-full border border-[#0B1F4D]/10"
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Product Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B1F4D] leading-tight">
                {product.name}
              </h1>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                Product SKU: PRV-{product.slug.toUpperCase().substring(0, 8)}
              </p>
            </div>

            {/* Price section */}
            <div className="p-5 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-[#0B1F4D]">
                  {formatPrice(product.price)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Approximate price based on weight</p>
              </div>
              <div className="text-right">
                <span className="inline-block text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                  ₹4 / gram Rate
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#0B1F4D] uppercase tracking-wider">
                Product Description
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description || "No description provided for this catalog item."}
              </p>
            </div>

            {/* Specifications Card */}
            <div className="bg-[#f8f9fb] rounded-2xl border border-[#e2e8f0] p-5 space-y-3.5">
              <h3 className="text-xs font-black text-[#0B1F4D] uppercase tracking-wider">
                Print Details &amp; Options
              </h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-5 text-xs text-slate-600">
                <div className="flex gap-2">
                  <Sparkles className="h-4 w-4 text-[#0B1F4D] shrink-0" />
                  <div>
                    <span className="font-bold text-[#0B1F4D] block">Material</span>
                    Tough PLA, ABS, or PETG
                  </div>
                </div>
                <div className="flex gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#0B1F4D] shrink-0" />
                  <div>
                    <span className="font-bold text-[#0B1F4D] block">Quality Assurance</span>
                    100% Infill / High Density
                  </div>
                </div>
                <div className="flex gap-2">
                  <Truck className="h-4 w-4 text-[#0B1F4D] shrink-0" />
                  <div>
                    <span className="font-bold text-[#0B1F4D] block">Delivery Type</span>
                    Shipment or Self Pick-up
                  </div>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-[#0B1F4D] shrink-0" />
                  <div>
                    <span className="font-bold text-[#0B1F4D] block">Color Options</span>
                    Custom options via call
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-[#e2e8f0] space-y-3">
            {isComingSoon ? (
              <Button disabled variant="primary" size="lg" className="w-full justify-center">
                Coming Soon
              </Button>
            ) : (
              <>
                <Link
                  href={`/buy/${product.slug}`}
                  id="product-buy-now-btn"
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#C41E2C] text-white font-bold hover:bg-[#a01824] transition-all shadow-md hover:shadow-lg text-base"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Buy Now
                </Link>
                <Link
                  href={`/quote?product=${product.slug}`}
                  id="product-request-quote-btn"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] font-bold hover:bg-[#0B1F4D]/5 transition-all text-sm"
                >
                  Request Custom Customization
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Fullscreen Lightbox */}
      {isLightboxOpen && activeImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between p-4 animate-fade-in">
          {/* Top Bar */}
          <div className="flex justify-between items-center text-white p-2 select-none">
            <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full">
              {activeIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Main image content with navigation */}
          <div className="relative flex-1 flex items-center justify-center">
            {images.length > 1 && (
              <button
                onClick={handlePrevImage}
                className="absolute left-2 p-3 rounded-full bg-black/40 text-white border border-white/10 hover:bg-black/60 active:scale-90 transition-all cursor-pointer z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <div className="relative max-w-full max-h-[75vh] aspect-square w-full">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>

            {images.length > 1 && (
              <button
                onClick={handleNextImage}
                className="absolute right-2 p-3 rounded-full bg-black/40 text-white border border-white/10 hover:bg-black/60 active:scale-90 transition-all cursor-pointer z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom helper */}
          <div className="text-center text-slate-400 text-xs py-2 select-none">
            Pinch to zoom dynamically on your device screen.
          </div>
        </div>
      )}
    </div>
  );
}
