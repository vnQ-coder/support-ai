"use client";

import { useRef, useEffect } from "react";
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
}

export function MessageList({ messages, isStreaming, greeting }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length - 1]?.content]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* Greeting message */}
      {messages.length === 0 && (
        <MessageBubble role="assistant" content={greeting} />
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
    </div>
  );
}
