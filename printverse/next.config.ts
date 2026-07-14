import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Allow up to 10 MB for server action form submissions (product image uploads)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // @react-pdf/renderer uses Node.js APIs and must not be bundled for the client
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
