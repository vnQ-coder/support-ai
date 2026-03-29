"use client";

import { useEffect, useState } from "react";

interface WaitTimeProps {
  since: Date;
}

function computeWait(since: Date): { text: string; level: "ok" | "warn" | "critical" } {
  const ms = Date.now() - since.getTime();
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let text: string;
  if (days > 0) text = `${days}d ${hours % 24}h`;
  else if (hours > 0) text = `${hours}h ${minutes % 60}m`;
  else text = `${minutes}m`;

  const level: "ok" | "warn" | "critical" =
    hours >= 4 ? "critical" : hours >= 1 ? "warn" : "ok";

  return { text, level };
}

export function WaitTime({ since }: WaitTimeProps) {
  const [wait, setWait] = useState(() => computeWait(since));

  useEffect(() => {
    const timer = setInterval(() => setWait(computeWait(since)), 60_000);
    return () => clearInterval(timer);
  }, [since]);

  const colorClass =
    wait.level === "critical"
      ? "text-destructive"
      : wait.level === "warn"
      ? "text-amber-500"
      : "text-muted-foreground";

  return (
    <span className={`text-xs font-medium ${colorClass}`}>
      Waiting {wait.text}
    </span>
  );
}
