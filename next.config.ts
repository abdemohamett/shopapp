import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable telemetry to avoid potential issues
  telemetry: false,
  // Ensure proper experimental features
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
