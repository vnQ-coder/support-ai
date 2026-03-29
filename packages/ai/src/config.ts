// AI model configuration — all via AI Gateway (provider/model strings)

export const AI_MODELS = {
  /** Primary model for customer-facing chat responses */
  chat: "anthropic/claude-sonnet-4.6",

  /** Fast model for intent classification and routing */
  classify: "anthropic/claude-haiku-4.5",

  /** Model for embedding generation */
  embedding: "openai/text-embedding-3-small",

  /** Model for complex multi-step reasoning */
  agent: "anthropic/claude-sonnet-4.6",
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
