"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { formatDuration } from "@repo/shared";
import { deleteSlaPolicyAction } from "./actions";

interface SlaPolicyRowProps {
  policy: {
    id: string;
    name: string;
    description: string | null;
    firstResponseMinutes: number;
    resolutionMinutes: number;
    priority: string;
    isDefault: boolean;
  };
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  normal: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  urgent: "bg-red-500/15 text-red-400 border-red-500/25",
};

export function SlaPolicyRow({ policy }: SlaPolicyRowProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex flex-1 items-center gap-4">
        {/* Name + description */}
        <div className="min-w-[140px]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{policy.name}</span>
            {policy.isDefault && (
              <Badge
                variant="outline"
                className="text-[10px] bg-green-500/15 text-green-400 border-green-500/25"
              >
                Default
              </Badge>
            )}
          </div>
          {policy.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {policy.description}
            </p>
          )}
        </div>

        {/* Priority */}
        <Badge
          variant="outline"
          className={`text-xs capitalize ${PRIORITY_STYLES[policy.priority] ?? ""}`}
        >
          {policy.priority}
        </Badge>

        {/* First Response */}
        <div className="hidden sm:block text-sm text-muted-foreground">
          <span className="text-xs text-muted-foreground/70">1st response:</span>{" "}
          {formatDuration(policy.firstResponseMinutes)}
        </div>

        {/* Resolution */}
        <div className="hidden sm:block text-sm text-muted-foreground">
          <span className="text-xs text-muted-foreground/70">Resolution:</span>{" "}
          {formatDuration(policy.resolutionMinutes)}
        </div>
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (
            confirm(
              `Delete SLA policy "${policy.name}"? This cannot be undone.`
            )
          ) {
            startTransition(() => deleteSlaPolicyAction(policy.id));
          }
        }}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
