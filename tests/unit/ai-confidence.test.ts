import { describe, it, expect } from "vitest";
import {
  extractConfidence,
  shouldEscalate,
  computeRetrievalConfidence,
} from "../../packages/ai/src/confidence";

describe("extractConfidence", () => {
  it("extracts confidence tag from end of text", () => {
    const result = extractConfidence(
      "Here is your answer about password reset. [confidence:0.85]"
    );
    expect(result.confidence).toBe(0.85);
    expect(result.cleanText).toBe(
      "Here is your answer about password reset."
    );
  });

  it("returns 0.5 when no confidence tag present", () => {
    const result = extractConfidence("Just a regular response.");
    expect(result.confidence).toBe(0.5);
    expect(result.cleanText).toBe("Just a regular response.");
  });

  it("clamps confidence to 0-1 range", () => {
    const result = extractConfidence("Answer [confidence:1.5]");
    expect(result.confidence).toBe(1);
  });

  it("handles confidence of 0", () => {
    const result = extractConfidence("No idea [confidence:0.0]");
    expect(result.confidence).toBe(0);
  });

  it("strips trailing whitespace with tag", () => {
    const result = extractConfidence("Answer here  [confidence:0.9]  ");
    expect(result.confidence).toBe(0.9);
    expect(result.cleanText).toBe("Answer here");
  });
});

describe("shouldEscalate", () => {
  it("returns true when confidence is below threshold", () => {
    expect(shouldEscalate(0.3)).toBe(true);
  });

  it("returns true when confidence equals threshold minus epsilon", () => {
    expect(shouldEscalate(0.69)).toBe(true);
  });

  it("returns false when confidence meets threshold", () => {
    expect(shouldEscalate(0.7)).toBe(false);
  });

  it("returns false when confidence is above threshold", () => {
    expect(shouldEscalate(0.95)).toBe(false);
  });
});

describe("computeRetrievalConfidence", () => {
  it("returns low confidence for empty scores", () => {
    expect(computeRetrievalConfidence([])).toBe(0.1);
  });

  it("returns high confidence for high scores", () => {
    const result = computeRetrievalConfidence([0.95, 0.88, 0.82]);
    expect(result).toBeGreaterThan(0.85);
  });

  it("weights top score more heavily", () => {
    // One high + many low should still be reasonably high
    const result = computeRetrievalConfidence([0.95, 0.2, 0.1]);
    expect(result).toBeGreaterThan(0.6);
  });

  it("returns moderate confidence for moderate scores", () => {
    const result = computeRetrievalConfidence([0.5, 0.45, 0.4]);
    expect(result).toBeGreaterThan(0.3);
    expect(result).toBeLessThan(0.6);
  });
});
