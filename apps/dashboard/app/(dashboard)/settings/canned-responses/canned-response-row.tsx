"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { CannedResponse } from "@/lib/queries/canned-responses";
import { deleteCannedResponseAction } from "./actions";

export function CannedResponseRow({ item }: { item: CannedResponse }) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <code className="text-xs bg-muted rounded px-1.5 py-0.5 text-primary shrink-0">/{item.shortcut}</code>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.content.slice(0, 80)}{item.content.length > 80 ? "\u2026" : ""}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">Used {item.usageCount}\u00d7</span>
      <Button variant="ghost" size="sm" disabled={isPending}
        onClick={() => { if (confirm(`Delete "${item.title}"?`)) startTransition(() => deleteCannedResponseAction(item.id)); }}>
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
