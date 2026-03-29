import { describe, it, expect } from "vitest";
import { evaluateEscalation, detectHumanRequest } from "./escalation";

describe("evaluateEscalation", () => {
  // Rule 1: Very low confidence -> urgent
  it("returns urgent escalation when confidence is below 0.3", () => {
    const result = evaluateEscalation({
      confidence: 0.2,
      messageCount: 1,
      hasExplicitRequest: false,
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("urgent");
    expect(result.reason).toContain("critically low");
  });

  it("returns urgent escalation when confidence is 0", () => {
    const result = evaluateEscalation({
      confidence: 0,
      messageCount: 1,
      hasExplicitRequest: false,
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("urgent");
  });

  // Rule 2: Low confidence -> high
  it("returns high escalation when confidence is between 0.3 and 0.5", () => {
    const result = evaluateEscalation({
      confidence: 0.4,
      messageCount: 1,
      hasExplicitRequest: false,
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("high");
    expect(result.reason).toContain("below acceptable threshold");
  });

  it("returns high escalation at exactly 0.3", () => {
    const result = evaluateEscalation({
      confidence: 0.3,
      messageCount: 1,
      hasExplicitRequest: false,
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("high");
  });

  // Rule 3: Sensitive topics -> high
  it("escalates billing topics with high priority", () => {
    const result = evaluateEscalation({
      confidence: 0.8,
      messageCount: 1,
      hasExplicitRequest: false,
      topic: "billing",
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("high");
    expect(result.reason).toContain("Sensitive topic");
  });

  it("escalates refund topics with high priority", () => {
    const result = evaluateEscalation({
      confidence: 0.9,
      messageCount: 1,
      hasExplicitRequest: false,
      topic: "refund",
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("high");
  });

  it("escalates cancellation topics", () => {
    const result = evaluateEscalation({
      confidence: 0.9,
      messageCount: 1,
      hasExplicitRequest: false,
      topic: "cancellation",
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("high");
  });

  it("is case-insensitive for topic matching", () => {
    const result = evaluateEscalation({
      confidence: 0.9,
      messageCount: 1,
      hasExplicitRequest: false,
      topic: "Billing",
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("high");
  });

  // Rule 4: Explicit human request -> medium
  it("escalates when user explicitly requests a human", () => {
    const result = evaluateEscalation({
      confidence: 0.8,
      messageCount: 1,
      hasExplicitRequest: true,
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("medium");
    expect(result.reason).toContain("explicitly requested");
  });

  // Rule 5: Too many messages -> medium
  it("escalates when message count exceeds 5", () => {
    const result = evaluateEscalation({
      confidence: 0.8,
      messageCount: 6,
      hasExplicitRequest: false,
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("medium");
    expect(result.reason).toContain("6 messages");
  });

  it("does not escalate at exactly 5 messages", () => {
    const result = evaluateEscalation({
      confidence: 0.8,
      messageCount: 5,
      hasExplicitRequest: false,
    });
    expect(result.shouldEscalate).toBe(false);
  });

  // Rule 6: Negative sentiment -> low
  it("escalates on negative sentiment with low priority", () => {
    const result = evaluateEscalation({
      confidence: 0.8,
      messageCount: 1,
      hasExplicitRequest: false,
      sentiment: "negative",
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("low");
  });

  it("escalates on frustrated sentiment", () => {
    const result = evaluateEscalation({
      confidence: 0.8,
      messageCount: 1,
      hasExplicitRequest: false,
      sentiment: "frustrated",
    });
    expect(result.shouldEscalate).toBe(true);
    expect(result.priority).toBe("low");
  });

  // No escalation
  it("does not escalate when all signals are positive", () => {
    const result = evaluateEscalation({
      confidence: 0.9,
      messageCount: 2,
      hasExplicitRequest: false,
      sentiment: "positive",
      topic: "general",
    });
    expect(result.shouldEscalate).toBe(false);
    expect(result.reason).toBe("");
  });

  // Priority ordering: confidence < 0.3 takes precedence over explicit request
  it("prioritizes urgent confidence over explicit request", () => {
    const result = evaluateEscalation({
      confidence: 0.1,
      messageCount: 10,
      hasExplicitRequest: true,
      topic: "billing",
      sentiment: "negative",
    });
    expect(result.priority).toBe("urgent");
  });

  // Priority ordering: low confidence takes precedence over topic
  it("prioritizes high confidence issue over topic", () => {
    const result = evaluateEscalation({
      confidence: 0.4,
      messageCount: 1,
      hasExplicitRequest: false,
      topic: "billing",
    });
    expect(result.priority).toBe("high");
    expect(result.reason).toContain("below acceptable threshold");
  });
});

describe("detectHumanRequest", () => {
  it("detects 'speak to a human'", () => {
    expect(detectHumanRequest("I want to speak to a human")).toBe(true);
  });

  it("detects 'talk to a human'", () => {
    expect(detectHumanRequest("Can I talk to a human please?")).toBe(true);
  });

  it("detects 'human agent'", () => {
    expect(detectHumanRequest("Connect me to a human agent")).toBe(true);
  });

  it("detects 'real person'", () => {
    expect(detectHumanRequest("I need to talk to a real person")).toBe(true);
  });

  it("detects 'live agent'", () => {
    expect(detectHumanRequest("Is there a live agent available?")).toBe(true);
  });

  it("detects 'representative'", () => {
    expect(detectHumanRequest("Let me speak to a representative")).toBe(true);
  });

  it("detects 'transfer me'", () => {
    expect(detectHumanRequest("Please transfer me")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(detectHumanRequest("SPEAK TO A HUMAN")).toBe(true);
  });

  it("returns false for normal messages", () => {
    expect(detectHumanRequest("How do I reset my password?")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(detectHumanRequest("")).toBe(false);
  });

  it("returns false for messages mentioning human in other contexts", () => {
    expect(detectHumanRequest("Is there a human-readable format?")).toBe(false);
  });
});
