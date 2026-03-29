// @repo/ai — AI engine: RAG pipeline, prompts, guardrails, tools, escalation

export { systemPrompt, buildContextPrompt, buildFullSystemPrompt } from "./prompts";
export { AI_MODELS, AI_CONFIG } from "./config";
export { retrieveContext, type RetrievedChunk } from "./rag";
export {
  escalateToHuman,
  createEscalateToHumanTool,
  escalateToHumanDefinition,
  searchKnowledgeDefinition,
} from "./tools";
export {
  extractConfidence,
  shouldEscalate,
  computeRetrievalConfidence,
} from "./confidence";
export {
  evaluateEscalation,
  detectHumanRequest,
  type EscalationResult,
  type EscalationParams,
} from "./escalation";
export { assignToAgent, type AssignedAgent } from "./assignment";
export { chunkText } from "./chunking";
export { sendEmail, sendAutoReply, buildAIResponseEmail } from "./email";
export type { SendEmailParams, SendEmailResult } from "./email";
export {
  aiResponseTemplate,
  agentResponseTemplate,
  autoReplyTemplate,
} from "./email-templates";
export { sendSms, sendWhatsApp, validateWebhookSignature } from "./twilio";
export type { SendSmsParams, SendSmsResult } from "./twilio";
