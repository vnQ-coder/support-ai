import { describe, it, expect } from "vitest";
import {
  validateApiKey,
  validateOrigin,
} from "../../apps/api/app/api/v1/_lib/auth";

describe("validateApiKey", () => {
  it("returns auth for valid live key", async () => {
    const request = new Request("http://localhost/api/v1/chat", {
      headers: { authorization: "Bearer sk_live_abc123xyz" },
    });
    const result = await validateApiKey(request);
    expect(result).not.toBeNull();
    expect(result!.isLive).toBe(true);
    expect(result!.organizationId).toBeDefined();
  });

  it("returns auth for valid test key", async () => {
    const request = new Request("http://localhost/api/v1/chat", {
      headers: { authorization: "Bearer sk_test_abc123xyz" },
    });
    const result = await validateApiKey(request);
    expect(result).not.toBeNull();
    expect(result!.isLive).toBe(false);
  });

  it("returns null for missing header", async () => {
    const request = new Request("http://localhost/api/v1/chat");
    const result = await validateApiKey(request);
    expect(result).toBeNull();
  });

  it("returns null for invalid prefix", async () => {
    const request = new Request("http://localhost/api/v1/chat", {
      headers: { authorization: "Bearer invalid_key_123" },
    });
    const result = await validateApiKey(request);
    expect(result).toBeNull();
  });

  it("returns null for non-Bearer auth", async () => {
    const request = new Request("http://localhost/api/v1/chat", {
      headers: { authorization: "Basic abc123" },
    });
    const result = await validateApiKey(request);
    expect(result).toBeNull();
  });
});

describe("validateOrigin", () => {
  it("allows all origins when allowedDomains is empty", () => {
    const request = new Request("http://localhost", {
      headers: { origin: "https://example.com" },
    });
    expect(validateOrigin(request, [])).toBe(true);
  });

  it("allows matching domain", () => {
    const request = new Request("http://localhost", {
      headers: { origin: "https://example.com" },
    });
    expect(validateOrigin(request, ["example.com"])).toBe(true);
  });

  it("allows subdomain of allowed domain", () => {
    const request = new Request("http://localhost", {
      headers: { origin: "https://app.example.com" },
    });
    expect(validateOrigin(request, ["example.com"])).toBe(true);
  });

  it("rejects non-matching domain", () => {
    const request = new Request("http://localhost", {
      headers: { origin: "https://evil.com" },
    });
    expect(validateOrigin(request, ["example.com"])).toBe(false);
  });

  it("rejects missing origin header", () => {
    const request = new Request("http://localhost");
    expect(validateOrigin(request, ["example.com"])).toBe(false);
  });
});
