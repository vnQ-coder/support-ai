"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function EscalationsPoller() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    function startPolling() {
      timer = setInterval(() => {
        if (!document.hidden) router.refresh();
      }, 30_000);
    }

    function handleVisibility() {
      if (!document.hidden) {
        router.refresh();
        startPolling();
      } else {
        clearInterval(timer);
      }
    }

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      Live
    </div>
  );
}
