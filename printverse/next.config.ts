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
  // @react-pdf/renderer uses Node.js APIs and must not be bundled for the client
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
