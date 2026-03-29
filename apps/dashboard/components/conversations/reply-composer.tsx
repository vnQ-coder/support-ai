"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";

interface ReplyComposerProps {
  conversationId: string;
  sendReplyAction: (conversationId: string, content: string) => Promise<{ error?: string }>;
}

export function ReplyComposer({
  conversationId,
  sendReplyAction,
}: ReplyComposerProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await sendReplyAction(conversationId, trimmed);
      if (result?.error) {
        setError(result.error);
      } else {
        setContent("");
        textareaRef.current?.focus();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border bg-card p-4"
    >
      {error && (
        <p className="mb-2 text-xs text-red-400">{error}</p>
      )}
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit(e);
            }
          }}
          placeholder="Type your reply... (Ctrl+Enter to send)"
          rows={3}
          className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
