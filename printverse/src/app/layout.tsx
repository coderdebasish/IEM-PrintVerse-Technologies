import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PrintVerse Technologies — Where Every Idea Takes Shape",
    template: "%s | PrintVerse Technologies",
  },
  description:
    "PrintVerse Technologies offers premium 3D printing services at a flat ₹4/gram for all products. Powered by IIFR Lab, IEM Kolkata. Request a quote or shop our catalog online.",
  keywords: [
    "3D printing",
    "custom 3D prints",
    "PrintVerse",
    "IEM Kolkata",
    "IIFR Lab",
    "3D printing India",
    "affordable 3D printing",
    "custom gifts",
    "engineering prototypes",
  ],
  authors: [{ name: "PrintVerse Technologies" }],
  creator: "PrintVerse Technologies",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "PrintVerse Technologies",
    title: "PrintVerse Technologies — Where Every Idea Takes Shape",
    description:
      "Premium 3D printing at ₹4/gram. 100% customized. Powered by IIFR Lab, IEM Kolkata.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PrintVerse Technologies",
    description: "Premium 3D printing at ₹4/gram. Powered by IIFR Lab, IEM Kolkata.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "Inter, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
