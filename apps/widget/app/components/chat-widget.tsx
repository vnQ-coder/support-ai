"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useChat, Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useWidgetConfig } from "../hooks/use-widget-config";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { EscalationBanner } from "./escalation-banner";
import { CsatSurvey } from "./csat-survey";

interface ChatWidgetProps {
  apiKey: string;
  apiBaseUrl: string;
}

export function ChatWidget({ apiKey, apiBaseUrl }: ChatWidgetProps) {
  const { config, isLoading, error } = useWidgetConfig(apiKey, apiBaseUrl);
  const [showEscalation, setShowEscalation] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [assignedAgentName, setAssignedAgentName] = useState<string | null>(null);
  const [showCsatSurvey, setShowCsatSurvey] = useState(false);
  const [csatDismissed, setCsatDismissed] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Create a stable Chat instance with transport
  const chat = useMemo(
    () =>
      new Chat({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- version mismatch between ai and @ai-sdk/react ChatTransport types
        transport: new DefaultChatTransport({
          api: `${apiBaseUrl}/api/v1/chat`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }) as any,
      }),
    [apiKey, apiBaseUrl]
  );

  const { messages, sendMessage, status } = useChat({ chat });

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSend = useCallback(
    (text: string) => {
      if (text.length > 2000) return;
      sendMessage({ text });
    },
    [sendMessage]
  );

  const handleRequestHuman = useCallback(() => {
    setIsEscalating(true);
    sendMessage({
      text: "I'd like to speak with a human agent please.",
    });
  }, [sendMessage]);

  // Detect conversation resolution from assistant messages.
  // Looks for resolution keywords or a system-level "[resolved]" tag in the
  // most recent assistant message. Also extracts conversationId from message
  // metadata if available.
  useEffect(() => {
    if (csatDismissed || showCsatSurvey) return;
    if (messages.length === 0) return;

    // Extract conversationId from any message metadata (set by the backend)
    for (const m of messages) {
      const meta = m.metadata as Record<string, unknown> | undefined;
      if (meta?.conversationId && typeof meta.conversationId === "string") {
        setConversationId(meta.conversationId);
        break;
      }
    }

    // Check the last assistant message for resolution signals
    const lastAssistantMsg = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistantMsg) return;

    const content =
      lastAssistantMsg.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("") ?? "";

    const resolutionPatterns = [
      /\[resolved\]/i,
      /conversation.*resolved/i,
      /issue.*resolved/i,
      /marked.*resolved/i,
      /has been resolved/i,
    ];

    const isResolved = resolutionPatterns.some((pattern) =>
      pattern.test(content)
    );

    if (isResolved) {
      setShowCsatSurvey(true);
    }
  }, [messages, csatDismissed, showCsatSurvey]);

  const handleCsatDismiss = useCallback(() => {
    setShowCsatSurvey(false);
    setCsatDismissed(true);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-medium text-red-500">Configuration Error</p>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!config) return null;

  const chatMessages = messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content:
      m.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("") ?? "",
  }));

  return (
    <div className="flex h-full flex-col bg-background">
      <ChatHeader
        config={config}
        onMinimize={() => {
          window.parent.postMessage({ type: "supportai:close" }, "*");
        }}
      />

      <MessageList
        messages={chatMessages}
        isStreaming={isStreaming}
        greeting={config.greeting}
      />

      {showEscalation && (
        <EscalationBanner
          onRequestHuman={handleRequestHuman}
          onDismiss={() => setShowEscalation(false)}
          isEscalating={isEscalating}
          agentName={assignedAgentName}
        />
      )}

      {showCsatSurvey && conversationId && (
        <CsatSurvey
          conversationId={conversationId}
          apiUrl={apiBaseUrl}
          widgetKey={apiKey}
          onDismiss={handleCsatDismiss}
        />
      )}

      <ChatInput
        onSend={handleSend}
        placeholder={config.placeholder}
        disabled={isStreaming}
      />

      {config.showBranding && (
        <div className="border-t px-4 py-2 text-center">
          <p className="text-[10px] text-muted-foreground">
            Powered by <span className="font-semibold">SupportAI</span>
          </p>
        </div>
      )}
    </div>
  );
}
