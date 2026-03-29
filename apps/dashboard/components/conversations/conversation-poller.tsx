"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ConversationPollerProps {
  conversationId: string;
  lastMessageAt: string;
}

/**
 * Client Component that polls the conversation API every 10 seconds.
 * When new data is detected (updatedAt differs from lastMessageAt),
 * it calls router.refresh() to re-fetch Server Component data.
 */
export function ConversationPoller({
  conversationId,
  lastMessageAt,
}: ConversationPollerProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/conversations/${conversationId}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.updatedAt !== lastMessageAt) {
            router.refresh();
          }
        }
      } catch {
        // Silently ignore network errors — next poll will retry
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [conversationId, lastMessageAt, router]);

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Live
    </div>
  );
}
