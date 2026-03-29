import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/shared",
    "react-markdown",
    "rehype-sanitize",
    // ESM-only transitive deps of react-markdown / unified ecosystem
    "unified",
    "remark-parse",
    "remark-rehype",
    "hast-util-sanitize",
    "devlop",
    "micromark",
    "mdast-util-from-markdown",
    "mdast-util-to-hast",
    "unist-util-stringify-position",
  ],

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
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:; frame-ancestors *; img-src 'self' data: https: blob:; font-src 'self' https:; media-src 'self' blob:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
