"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface MessageMetadata {
  messageType?: "quick_reply" | "text";
  options?: string[];
  [key: string]: unknown;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  apiBaseUrl?: string;
  messageId?: string;
  metadata?: MessageMetadata;
  onQuickReply?: (option: string) => void;
}

export function MessageBubble({
  role,
  content,
  isStreaming,
  apiBaseUrl,
  messageId,
  metadata,
  onQuickReply,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const [feedbackGiven, setFeedbackGiven] = useState<
    "thumbs_up" | "thumbs_down" | null
  >(null);

  const submitFeedback = async (feedback: "thumbs_up" | "thumbs_down") => {
    setFeedbackGiven(feedback);
    try {
      await fetch(`${apiBaseUrl}/api/v1/messages/${messageId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
    } catch {
      // Silent fail on feedback
    }
  };

  // Strip confidence tag from display
  const displayContent = content.replace(/\[confidence:[\d.]+\]\s*$/, "");

  // Typing indicator
  if (isStreaming && !content) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-muted text-foreground rounded-bl-md">
          <div className="flex items-center gap-1 px-1">
            <span className="text-xs text-muted-foreground">Typing</span>
            <span className="flex gap-0.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col gap-1 max-w-[85%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-white rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          }`}
        >
          {displayContent ? (
            isUser ? (
              <div className="whitespace-pre-wrap break-words">
                {displayContent}
              </div>
            ) : (
              <ReactMarkdown
                rehypePlugins={[rehypeSanitize]}
                className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  code: ({ children, className }) => {
                    const isBlock = className?.includes("language-");
                    return isBlock ? (
                      <pre className="overflow-x-auto rounded bg-black/20 p-2 text-xs">
                        <code>{children}</code>
                      </pre>
                    ) : (
                      <code className="rounded bg-black/10 px-1 py-0.5 text-xs">
                        {children}
                      </code>
                    );
                  },
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {displayContent}
              </ReactMarkdown>
            )
          ) : null}
        </div>

        {/* Quick reply chips */}
        {!isUser &&
          metadata?.messageType === "quick_reply" &&
          metadata?.options && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {metadata.options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => onQuickReply?.(opt)}
                  className="rounded-full border border-border px-3 py-1 text-xs hover:bg-accent transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

        {/* Feedback buttons for assistant messages */}
        {!isUser && !isStreaming && displayContent && (
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={() => submitFeedback("thumbs_up")}
              disabled={feedbackGiven !== null}
              className={`rounded p-1 transition-opacity hover:bg-muted ${
                feedbackGiven === "thumbs_up"
                  ? "opacity-100"
                  : feedbackGiven !== null
                    ? "opacity-20"
                    : "opacity-40 hover:opacity-70"
              }`}
              aria-label="Thumbs up"
            >
              <ThumbsUp
                className="h-3.5 w-3.5"
                fill={feedbackGiven === "thumbs_up" ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={() => submitFeedback("thumbs_down")}
              disabled={feedbackGiven !== null}
              className={`rounded p-1 transition-opacity hover:bg-muted ${
                feedbackGiven === "thumbs_down"
                  ? "opacity-100"
                  : feedbackGiven !== null
                    ? "opacity-20"
                    : "opacity-40 hover:opacity-70"
              }`}
              aria-label="Thumbs down"
            >
              <ThumbsDown
                className="h-3.5 w-3.5"
                fill={
                  feedbackGiven === "thumbs_down" ? "currentColor" : "none"
                }
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
