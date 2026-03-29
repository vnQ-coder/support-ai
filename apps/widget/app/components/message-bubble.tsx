"use client";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-white rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        }`}
      >
        {content ? (
          <div className="whitespace-pre-wrap break-words">
            {/* Strip confidence tag from display */}
            {content.replace(/\[confidence:[\d.]+\]\s*$/, "")}
          </div>
        ) : isStreaming ? (
          <span className="inline-flex gap-1">
            <span className="h-2 w-2 rounded-full bg-current opacity-40 animate-bounce" />
            <span className="h-2 w-2 rounded-full bg-current opacity-40 animate-bounce [animation-delay:150ms]" />
            <span className="h-2 w-2 rounded-full bg-current opacity-40 animate-bounce [animation-delay:300ms]" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
