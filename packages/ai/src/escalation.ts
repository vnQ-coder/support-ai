/**
 * Escalation rules engine.
 * Evaluates whether a conversation should be escalated to a human agent
 * based on confidence, message count, sentiment, and topic signals.
 */

import type { EscalationPriority } from "@repo/shared";

export interface EscalationResult {
  shouldEscalate: boolean;
  reason: string;
  priority: EscalationPriority;
}

export interface EscalationParams {
  /** AI confidence score (0.0 - 1.0) */
  confidence: number;
  /** Number of messages exchanged in the conversation */
  messageCount: number;
  /** Detected sentiment of the user (optional) */
  sentiment?: string;
  /** Whether the user explicitly requested a human */
  hasExplicitRequest: boolean;
  /** Detected topic of the conversation (optional) */
  topic?: string;
}

/** Topics that always require human intervention */
const SENSITIVE_TOPICS = new Set([
  "billing",
  "refund",
  "cancellation",
  "account_deletion",
  "legal",
  "complaint",
]);

/** Maximum messages before auto-escalation when unresolved */
const MAX_UNRESOLVED_MESSAGES = 5;

/**
 * Evaluate whether a conversation should be escalated to a human agent.
 *
 * Rules (evaluated in priority order):
 * 1. Confidence < 0.3  -> escalate (urgent)
 * 2. Confidence < 0.5  -> escalate (high)
 * 3. Sensitive topics (billing, refund, etc.) -> escalate (high)
 * 4. Explicit human request -> escalate (medium)
 * 5. Message count > 5 without resolution -> escalate (medium)
 * 6. Negative sentiment -> escalate (low) -- advisory only
 *
 * Returns the highest-priority match.
 */
export function evaluateEscalation(params: EscalationParams): EscalationResult {
  const {
    confidence,
    messageCount,
    sentiment,
    hasExplicitRequest,
    topic,
  } = params;

  // Rule 1: Very low confidence -- urgent
  if (confidence < 0.3) {
    return {
      shouldEscalate: true,
      reason: "AI confidence is critically low. Unable to provide a reliable answer.",
      priority: "urgent",
    };
  }

  // Rule 2: Low confidence -- high
  if (confidence < 0.5) {
    return {
      shouldEscalate: true,
      reason: "AI confidence is below acceptable threshold for this query.",
      priority: "high",
    };
  }

  // Rule 3: Sensitive topic -- high
  if (topic && SENSITIVE_TOPICS.has(topic.toLowerCase())) {
    return {
      shouldEscalate: true,
      reason: `Sensitive topic detected: ${topic}. Requires human review.`,
      priority: "high",
    };
  }

  // Rule 4: Explicit human request -- medium
  if (hasExplicitRequest) {
    return {
      shouldEscalate: true,
      reason: "Customer explicitly requested to speak with a human agent.",
      priority: "medium",
    };
  }

  // Rule 5: Too many messages without resolution -- medium
  if (messageCount > MAX_UNRESOLVED_MESSAGES) {
    return {
      shouldEscalate: true,
      reason: `Conversation has ${messageCount} messages without resolution. Escalating for human assistance.`,
      priority: "medium",
    };
  }

  // Rule 6: Negative sentiment -- low (advisory, still escalates)
  if (sentiment === "negative" || sentiment === "frustrated") {
    return {
      shouldEscalate: true,
      reason: "Negative customer sentiment detected. Proactive escalation recommended.",
      priority: "low",
    };
  }

  // No escalation needed
  return {
    shouldEscalate: false,
    reason: "",
    priority: "low",
  };
}

/**
 * Check if a user message contains an explicit request for a human agent.
 * Used as a pre-processing step before AI response generation.
 */
export function detectHumanRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const humanRequestPatterns = [
    "speak to a human",
    "talk to a human",
    "human agent",
    "real person",
    "speak to someone",
    "talk to someone",
    "speak with a human",
    "talk with a human",
    "connect me with",
    "transfer me",
    "escalate",
    "speak to a person",
    "talk to a person",
    "i want a human",
    "get me a human",
    "real agent",
    "live agent",
    "live support",
    "human support",
    "operator",
    "representative",
  ];
  return humanRequestPatterns.some((pattern) => lowerMessage.includes(pattern));
}
