"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client Component that refreshes the conversations list every 30 seconds
 * so new conversations appear without a manual page reload.
 */
export function ConversationsListPoller() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30_000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Auto-refresh
    </div>
  );
}
