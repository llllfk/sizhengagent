import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 本地 public 静态图；远程域名需要时再补 remotePatterns
    unoptimized: false,
  },
};

export default nextConfig;
