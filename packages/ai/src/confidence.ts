/**
 * Confidence scoring for AI responses.
 * Extracts confidence from model output and determines escalation needs.
 */

import { AI_CONFIG } from "./config";

/**
 * Extract confidence score from model output text.
 * The system prompt instructs the model to append [confidence:X.XX] tag.
 */
export function extractConfidence(text: string): {
  confidence: number;
  cleanText: string;
} {
  const confidenceRegex = /\[confidence:([\d.]+)\]\s*$/;
  const match = text.match(confidenceRegex);

  if (match) {
    const score = Math.min(1, Math.max(0, parseFloat(match[1]!)));
    const cleanText = text.replace(confidenceRegex, "").trimEnd();
    return { confidence: score, cleanText };
  }

  // Default to medium confidence if tag is missing
  return { confidence: 0.5, cleanText: text };
}

/**
 * Determine if the AI response should suggest escalation to a human.
 */
export function shouldEscalate(confidence: number): boolean {
  return confidence < AI_CONFIG.confidenceThreshold;
}

/**
 * Compute confidence from RAG retrieval scores.
 * Used as a secondary signal alongside model self-reported confidence.
 */
export function computeRetrievalConfidence(
  scores: number[]
): number {
  if (scores.length === 0) return 0.1;

  // Weighted average: highest score matters most
  const sorted = [...scores].sort((a, b) => b - a);
  const topScore = sorted[0]!;
  const avgScore =
    sorted.reduce((sum, s) => sum + s, 0) / sorted.length;

  // 70% top score + 30% average
  return topScore * 0.7 + avgScore * 0.3;
}
