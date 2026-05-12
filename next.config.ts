import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_TARGET === "apk" ? "export" : "standalone",
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
