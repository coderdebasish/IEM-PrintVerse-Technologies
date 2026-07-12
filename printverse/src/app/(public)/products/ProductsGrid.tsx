"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils/helpers";
import type { Product, ProductCategory } from "@/types";

interface ProductsGridProps {
  products: Product[];
  activeCategory: ProductCategory | null;
}

export function ProductsGrid({ products, activeCategory }: ProductsGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#0B1F4D] mb-2">
          {activeCategory
            ? `No ${activeCategory} products yet`
            : "Catalog coming soon"}
        </h2>
        <p className="text-slate-500 text-sm mb-8">
          Products are being added. In the meantime, request a custom quote!
        </p>
        <Link
          href="/quote"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#C41E2C] text-white font-bold hover:bg-[#a01824] transition-colors"
        >
          Request a Custom Quote
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const isComingSoon = product.is_coming_soon || !product.is_available;

  return (
    <div
      className="group bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden card-hover"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Image */}
      <div className="relative aspect-square bg-[#f8f9fb] overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-12 w-12 text-slate-200" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="text-xs font-semibold bg-[#0B1F4D]/80 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
            {product.category}
          </span>
          {isComingSoon && (
            <span className="text-xs font-bold bg-[#D4A017] text-[#0B1F4D] px-2 py-0.5 rounded-full">
              Coming Soon
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-[#0B1F4D] text-base leading-snug mb-1 line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-end justify-between gap-2 mt-auto">
          <div>
            <p className="text-2xl font-black text-[#0B1F4D]">
              {formatPrice(product.price)}
            </p>
            <p className="text-xs text-slate-400">approx. ₹4/gram</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {isComingSoon ? (
            <Badge variant="warning" className="w-full justify-center py-2">
              Coming Soon
            </Badge>
          ) : (
            <>
              <Link
                href={`/buy/${product.slug}`}
                id={`buy-now-${product.slug}`}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#C41E2C] text-white font-semibold text-sm hover:bg-[#a01824] transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy Now
              </Link>
              <Link
                href={`/products/${product.slug}`}
                id={`view-${product.slug}`}
                className="px-3 py-2.5 rounded-xl border-2 border-[#0B1F4D]/20 text-[#0B1F4D] text-sm font-semibold hover:border-[#0B1F4D]/50 hover:bg-[#f8f9fb] transition-all"
              >
                <Search className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
