import { z } from "zod";
import { MAX_MESSAGE_LENGTH } from "./constants";

// Chat message schemas
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
  channel: z.enum(["web_chat", "email", "whatsapp", "sms"]).default("web_chat"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// Knowledge source schemas
export const createKnowledgeSourceSchema = z.object({
  type: z.enum(["url", "file", "text"]),
  name: z.string().min(1).max(255),
  sourceUrl: z.string().url().optional(),
  content: z.string().optional(),
});

export type CreateKnowledgeSourceInput = z.infer<typeof createKnowledgeSourceSchema>;

// Widget config schemas
export const updateWidgetConfigSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  greeting: z.string().max(500).optional(),
  placeholder: z.string().max(200).optional(),
  position: z.enum(["bottom-right", "bottom-left"]).optional(),
  allowedDomains: z.array(z.string()).optional(),
  showBranding: z.boolean().optional(),
});

export type UpdateWidgetConfigInput = z.infer<typeof updateWidgetConfigSchema>;

// Escalation schemas
export const escalateRequestSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
  reason: z.string().min(1, "reason is required").max(1000),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export type EscalateRequestInput = z.infer<typeof escalateRequestSchema>;

export const markNotificationReadSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
  agentId: z.string().min(1, "agentId is required"),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

// API key schema
export const apiKeyHeaderSchema = z.object({
  authorization: z
    .string()
    .regex(/^Bearer sk_(live|test)_[a-zA-Z0-9]{32,}$/),
});

// Pagination schema
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// Pre-chat form validation
export const preChatSchema = z.object({
  name: z.string().max(255).optional(),
  email: z.string().email().max(255),
});

export type PreChatInput = z.infer<typeof preChatSchema>;

// Message feedback
export const messageFeedbackSchema = z.object({
  feedback: z.enum(["thumbs_up", "thumbs_down"]),
});

export type MessageFeedbackInput = z.infer<typeof messageFeedbackSchema>;

// Widget session token exchange
export const widgetSessionSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
});

export type WidgetSessionInput = z.infer<typeof widgetSessionSchema>;

// Extended widget config (matching new DB columns)
export const extendedWidgetConfigSchema = z.object({
  primaryColor: z.string().max(7).default("#3B82F6"),
  greeting: z.string().default("Hi! How can we help you today?"),
  placeholder: z.string().max(200).default("Type a message..."),
  position: z.enum(["bottom-right", "bottom-left"]).default("bottom-right"),
  allowedDomains: z.array(z.string()).default([]),
  showBranding: z.boolean().default(true),
  // New fields
  logoUrl: z.string().url().nullable().optional(),
  widgetTitle: z.string().max(255).nullable().optional(),
  autoOpenDelay: z.number().int().min(0).nullable().optional(),
  preChatFields: z.array(z.object({
    name: z.string(),
    type: z.enum(["text", "email", "phone", "select"]),
    required: z.boolean(),
  })).default([]),
  customCss: z.string().nullable().optional(),
  bubbleIcon: z.enum(["chat", "help", "wave"]).default("chat"),
  soundEnabled: z.boolean().default(true),
  offlineMessage: z.string().nullable().optional(),
  theme: z.enum(["light", "dark", "auto"]).default("light"),
  positionOffsetX: z.number().int().default(20),
  positionOffsetY: z.number().int().default(20),
});

export type ExtendedWidgetConfigInput = z.infer<typeof extendedWidgetConfigSchema>;

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().max(5 * 1024 * 1024, "File must be under 5MB"),
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;
