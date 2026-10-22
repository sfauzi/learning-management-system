import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
  images: { unoptimized: true },
};

export default nextConfig;
