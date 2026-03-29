import { describe, it, expect } from "vitest";
import {
  systemPrompt,
  buildContextPrompt,
  buildFullSystemPrompt,
} from "../../packages/ai/src/prompts";

describe("systemPrompt", () => {
  it("includes organization name", () => {
    const prompt = systemPrompt("Acme Corp");
    expect(prompt).toContain("Acme Corp");
  });

  it("includes hallucination prevention rules", () => {
    const prompt = systemPrompt("Test Co");
    expect(prompt).toContain("ONLY answer questions using the provided knowledge base");
    expect(prompt).toContain("Never make up information");
  });

  it("includes confidence scoring instructions", () => {
    const prompt = systemPrompt("Test Co");
    expect(prompt).toContain("confidence");
    expect(prompt).toContain("0.7");
  });
});

describe("buildContextPrompt", () => {
  it("returns no-context message for empty chunks", () => {
    const result = buildContextPrompt([]);
    expect(result).toContain("No relevant knowledge base articles found");
  });

  it("includes all chunk contents", () => {
    const chunks = [
      { content: "Password reset guide", sourceName: "FAQ" },
      { content: "Billing information", sourceName: "Docs" },
    ];
    const result = buildContextPrompt(chunks);
    expect(result).toContain("Password reset guide");
    expect(result).toContain("Billing information");
    expect(result).toContain("FAQ");
    expect(result).toContain("Docs");
  });

  it("numbers sources correctly", () => {
    const chunks = [
      { content: "A", sourceName: "Source 1" },
      { content: "B", sourceName: "Source 2" },
    ];
    const result = buildContextPrompt(chunks);
    expect(result).toContain("[Source 1: Source 1]");
    expect(result).toContain("[Source 2: Source 2]");
  });
});

describe("buildFullSystemPrompt", () => {
  it("includes both system instructions and context", () => {
    const prompt = buildFullSystemPrompt("Test Co", [
      { content: "Help article", sourceName: "KB" },
    ]);
    expect(prompt).toContain("Test Co");
    expect(prompt).toContain("Help article");
    expect(prompt).toContain("TOOLS:");
    expect(prompt).toContain("escalateToHuman");
    expect(prompt).toContain("[confidence:");
  });

  it("handles empty context gracefully", () => {
    const prompt = buildFullSystemPrompt("Test Co", []);
    expect(prompt).toContain("No relevant knowledge base articles found");
  });
});
