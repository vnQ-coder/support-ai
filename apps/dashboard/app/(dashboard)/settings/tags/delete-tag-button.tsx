"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteTagAction } from "./actions";

export function DeleteTagButton({
  tagId,
  tagName,
}: {
  tagId: string;
  tagName: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (confirm(`Delete label "${tagName}"? This will remove it from all conversations.`)) {
          startTransition(() => deleteTagAction(tagId));
        }
      }}
    >
      <Trash2 className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}
