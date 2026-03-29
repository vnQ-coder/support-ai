"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { MessageBubble } from "./message-bubble";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  greeting: string;
  onSuggestionClick?: (text: string) => void;
}

const SUGGESTIONS = [
  "How do I get started?",
  "What are your pricing plans?",
  "I need help with my account",
  "Talk to a human",
];

export function MessageList({
  messages,
  isStreaming,
  greeting,
  onSuggestionClick,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length - 1]?.content]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 100;
    setShowScrollButton(!isNearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative flex-1 overflow-y-auto p-4 space-y-3"
    >
      {/* Empty state: greeting + suggestion pills */}
      {messages.length === 0 && (
        <>
          <MessageBubble role="assistant" content={greeting} />
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => onSuggestionClick?.(text)}
                className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent transition-colors cursor-pointer"
              >
                {text}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Messages */}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          role={msg.role}
          content={msg.content}
          isStreaming={
            isStreaming &&
            msg.role === "assistant" &&
            msg.id === messages[messages.length - 1]?.id
          }
        />
      ))}

      {/* Streaming indicator when waiting for first token */}
      {isStreaming &&
        messages.length > 0 &&
        messages[messages.length - 1]?.role === "user" && (
          <MessageBubble role="assistant" content="" isStreaming />
        )}

      <div ref={bottomRef} />

      {/* Scroll-to-bottom button */}
      {showScrollButton && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="sticky bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center rounded-full border border-border bg-background shadow-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-3.5 w-3.5 mr-1" />
          New messages
        </button>
      )}
    </div>
  );
}
