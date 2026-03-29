import type { MessageItem } from "@/lib/queries/conversations";

interface MessageThreadProps {
  messages: MessageItem[];
}

function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let color = "bg-emerald-500/10 text-emerald-400";
  if (confidence < 0.7) {
    color = "bg-red-500/10 text-red-400";
  } else if (confidence < 0.85) {
    color = "bg-amber-500/10 text-amber-400";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {Math.round(confidence * 100)}% confidence
    </span>
  );
}

function SenderLabel({ sender }: { sender: string }) {
  const config: Record<string, { label: string; className: string }> = {
    user: { label: "Customer", className: "text-blue-400" },
    ai: { label: "AI Agent", className: "text-purple-400" },
    agent: { label: "Human Agent", className: "text-emerald-400" },
  };

  const c = config[sender] ?? { label: sender, className: "text-muted-foreground" };

  return <span className={`text-xs font-medium ${c.className}`}>{c.label}</span>;
}

export function MessageThread({ messages }: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-6">
      {messages.map((msg) => {
        const isUser = msg.sender === "user";
        return (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-2">
              <SenderLabel sender={msg.sender} />
              <span className="text-xs text-muted-foreground">
                {formatMessageTime(msg.createdAt)}
              </span>
            </div>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                isUser
                  ? "bg-primary text-primary-foreground"
                  : msg.sender === "ai"
                    ? "bg-purple-500/10 text-foreground border border-purple-500/20"
                    : "bg-muted text-foreground"
              }`}
            >
              {msg.content}
            </div>
            {msg.sender === "ai" && msg.confidence !== null && (
              <ConfidenceBadge confidence={msg.confidence} />
            )}
          </div>
        );
      })}
    </div>
  );
}
