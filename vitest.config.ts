import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@repo/shared": path.resolve(__dirname, "packages/shared/src"),
      "@repo/ai": path.resolve(__dirname, "packages/ai/src"),
    },
  },
});
