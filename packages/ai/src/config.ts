// AI model configuration
// Using Google Gemini (free tier) for local development
// Switch to AI Gateway (provider/model strings) for production on Vercel

import { google } from "@ai-sdk/google";

export const AI_MODELS = {
  /** Primary model for customer-facing chat responses */
  chat: google("gemini-2.0-flash"),

  /** Fast model for intent classification and routing */
  classify: google("gemini-2.0-flash"),

  /** Model for embedding generation */
  embedding: google.textEmbeddingModel("text-embedding-004"),

  /** Model for complex multi-step reasoning */
  agent: google("gemini-2.0-flash"),
} as const;

export const AI_CONFIG = {
  /** Confidence threshold below which we escalate to human */
  confidenceThreshold: 0.7,

  /** Maximum tokens for chat response */
  maxTokens: 1024,

  /** Temperature for chat responses (lower = more deterministic) */
  temperature: 0.3,

  /** Maximum number of knowledge chunks to include in context */
  maxContextChunks: 5,

  /** Maximum conversation history messages to include */
  maxHistoryMessages: 20,
} as const;
