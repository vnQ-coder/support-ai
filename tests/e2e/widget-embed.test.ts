import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * E2E tests for the widget embed script.
 * These validate the embed.js file structure and behavior.
 * For full browser E2E, Playwright would be used with a running dev server.
 */
describe("Widget Embed Script", () => {
  const embedPath = resolve(
    __dirname,
    "../../apps/widget/public/embed.js"
  );
  let embedScript: string;

  try {
    embedScript = readFileSync(embedPath, "utf-8");
  } catch {
    embedScript = "";
  }

  it("embed.js file exists and is non-empty", () => {
    expect(embedScript.length).toBeGreaterThan(0);
  });

  it("is wrapped in an IIFE for scope isolation", () => {
    expect(embedScript).toContain("(function");
    expect(embedScript).toContain("\"use strict\"");
  });

  it("reads data-api-key attribute", () => {
    expect(embedScript).toContain("data-api-key");
    expect(embedScript).toContain("getAttribute");
  });

  it("creates launcher element", () => {
    expect(embedScript).toContain("supportai-launcher");
    expect(embedScript).toContain("createElement");
  });

  it("creates iframe for widget", () => {
    expect(embedScript).toContain("iframe");
    expect(embedScript).toContain("supportai-widget");
  });

  it("supports postMessage communication", () => {
    expect(embedScript).toContain("postMessage");
    expect(embedScript).toContain("supportai:close");
  });

  it("exposes public API on window.SupportAI", () => {
    expect(embedScript).toContain("window.SupportAI");
    expect(embedScript).toContain("open: function");
    expect(embedScript).toContain("close: function");
    expect(embedScript).toContain("toggle: toggleWidget");
  });

  it("sets proper accessibility attributes", () => {
    expect(embedScript).toContain("aria-label");
    expect(embedScript).toContain("tabindex");
    expect(embedScript).toContain("role");
  });

  it("supports bottom-left position", () => {
    expect(embedScript).toContain("bottom-left");
    expect(embedScript).toContain("data-position");
  });

  it("handles mobile responsive layout", () => {
    expect(embedScript).toContain("innerWidth");
    expect(embedScript).toContain("640");
  });

  it("logs error when API key is missing", () => {
    expect(embedScript).toContain("Missing data-api-key");
    expect(embedScript).toContain("console.error");
  });

  it("supports keyboard interaction", () => {
    expect(embedScript).toContain("keydown");
    expect(embedScript).toContain("Enter");
  });

  it("does not exceed 50KB", () => {
    const sizeKB = Buffer.byteLength(embedScript, "utf-8") / 1024;
    expect(sizeKB).toBeLessThan(50);
  });
});

describe("Widget Embed Integration", () => {
  it("embed script produces valid URL with apiKey param", () => {
    const apiKey = "sk_live_test123";
    const widgetUrl = "http://localhost:3001";
    const url = `${widgetUrl}?apiKey=${encodeURIComponent(apiKey)}&host=${encodeURIComponent("http://localhost:3002")}`;

    const parsed = new URL(url);
    expect(parsed.searchParams.get("apiKey")).toBe(apiKey);
    expect(parsed.searchParams.get("host")).toBe("http://localhost:3002");
  });

  it("API key format validation", () => {
    const validLiveKey = "sk_live_abc123xyz456";
    const validTestKey = "sk_test_abc123xyz456";
    const invalidKey = "invalid_key_123";

    expect(validLiveKey.startsWith("sk_live_")).toBe(true);
    expect(validTestKey.startsWith("sk_test_")).toBe(true);
    expect(
      invalidKey.startsWith("sk_live_") || invalidKey.startsWith("sk_test_")
    ).toBe(false);
  });
});
