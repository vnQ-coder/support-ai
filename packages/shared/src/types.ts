// Core domain types for SupportAI

export type Role = "owner" | "admin" | "agent" | "viewer";

export type ConversationStatus =
  | "active"
  | "waiting"
  | "escalated"
  | "resolved"
  | "closed";

export type EscalationPriority = "low" | "medium" | "high" | "urgent";

export type ConversationChannel =
  | "web_chat"
  | "email"
  | "whatsapp"
  | "sms";

export type MessageSender = "customer" | "ai" | "agent";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "growth" | "pro" | "enterprise";
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  organizationId: string;
  contactId: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  assigneeId: string | null;
  subject: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  confidence: number | null;
  sources: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface Contact {
  id: string;
  organizationId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeSource {
  id: string;
  organizationId: string;
  type: "url" | "file" | "text";
  name: string;
  sourceUrl: string | null;
  status: "pending" | "indexing" | "ready" | "error";
  chunkCount: number;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfig {
  id: string;
  organizationId: string;
  primaryColor: string;
  greeting: string;
  placeholder: string;
  position: "bottom-right" | "bottom-left";
  allowedDomains: string[];
  showBranding: boolean;
}

export interface AnalyticsOverview {
  totalConversations: number;
  aiResolved: number;
  humanResolved: number;
  averageResponseTime: number;
  averageCsat: number;
  resolutionRate: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type PreChatData = { name?: string; email: string };

export type MessageFeedback = "thumbs_up" | "thumbs_down";

export type MessageType = "text" | "card" | "quick_reply" | "system" | "image";

export type RichMessageMetadata = {
  messageType?: MessageType;
  options?: string[]; // For quick_reply
  cardTitle?: string;
  cardDescription?: string;
  cardImageUrl?: string;
  cardActionUrl?: string;
  cardActionLabel?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
};

export type WidgetTheme = "light" | "dark" | "auto";

// SlaStatus is defined and exported from sla-utils.ts
