import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/shared"],

  // Required for monorepo: lets Next.js trace files outside the app directory
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // Security
  poweredByHeader: false,
  reactStrictMode: true,

  // Turbopack config (top-level in Next.js 16)
  turbopack: {},
};

export default nextConfig;
