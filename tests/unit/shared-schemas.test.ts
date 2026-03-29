import { describe, it, expect } from "vitest";
import {
  sendMessageSchema,
  updateWidgetConfigSchema,
  paginationSchema,
} from "../../packages/shared/src/schemas";

describe("sendMessageSchema", () => {
  it("accepts valid message", () => {
    const result = sendMessageSchema.safeParse({
      content: "Hello, I need help",
      channel: "web_chat",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = sendMessageSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects content over 10000 chars", () => {
    const result = sendMessageSchema.safeParse({
      content: "a".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("defaults channel to web_chat", () => {
    const result = sendMessageSchema.parse({ content: "Hello" });
    expect(result.channel).toBe("web_chat");
  });

  it("accepts valid channel values", () => {
    for (const channel of ["web_chat", "email", "whatsapp", "sms"]) {
      const result = sendMessageSchema.safeParse({
        content: "test",
        channel,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid channel", () => {
    const result = sendMessageSchema.safeParse({
      content: "test",
      channel: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateWidgetConfigSchema", () => {
  it("accepts valid hex color", () => {
    const result = updateWidgetConfigSchema.safeParse({
      primaryColor: "#FF5733",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex color", () => {
    const result = updateWidgetConfigSchema.safeParse({
      primaryColor: "red",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid position", () => {
    const result = updateWidgetConfigSchema.safeParse({
      position: "bottom-left",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all optional)", () => {
    const result = updateWidgetConfigSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("paginationSchema", () => {
  it("defaults limit to 20", () => {
    const result = paginationSchema.parse({});
    expect(result.limit).toBe(20);
  });

  it("accepts custom limit", () => {
    const result = paginationSchema.parse({ limit: 50 });
    expect(result.limit).toBe(50);
  });

  it("rejects limit over 100", () => {
    const result = paginationSchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });

  it("coerces string limit to number", () => {
    const result = paginationSchema.parse({ limit: "10" });
    expect(result.limit).toBe(10);
  });
});
