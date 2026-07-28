import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Profile photos / credentials allow up to 5 MB; intro video up to ~8 MB.
  // Multipart overhead needs headroom above the raw file size.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
