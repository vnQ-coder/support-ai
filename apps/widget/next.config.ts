import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/shared"],

  // Required for monorepo: lets Next.js trace files outside the app directory
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // Security
  poweredByHeader: false,
  reactStrictMode: true,

  // Turbopack config (top-level in Next.js 16)
  turbopack: {},

  // Widget needs to be embeddable cross-origin
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
