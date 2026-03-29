"use client";
import { useEffect, useState } from "react";
import { Command, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { searchCannedResponsesAction } from "@/app/(dashboard)/settings/canned-responses/actions";
import type { CannedResponse } from "@/lib/queries/canned-responses";

interface CannedResponsePickerProps {
  trigger: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  onSelect: (content: string) => void;
  onClose: () => void;
}

export function CannedResponsePicker({ trigger, onSelect, onClose }: CannedResponsePickerProps) {
  const [results, setResults] = useState<CannedResponse[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (trigger.length === 0) { setOpen(false); return; }
    setOpen(true);
    searchCannedResponsesAction(trigger).then(setResults).catch(() => setResults([]));
  }, [trigger]);

  if (!open || results.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-1 w-72 z-50 rounded-md border border-border bg-popover shadow-md">
      <Command>
        <CommandList>
          <CommandEmpty>No matches for /{trigger}</CommandEmpty>
          {results.map(r => (
            <CommandItem
              key={r.id}
              onSelect={() => { onSelect(r.content); onClose(); }}
              className="cursor-pointer flex flex-col items-start gap-0.5 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted rounded px-1 text-primary">/{r.shortcut}</code>
                <span className="text-sm font-medium">{r.title}</span>
              </div>
              <span className="text-xs text-muted-foreground truncate w-full">{r.content.slice(0, 60)}{"\u2026"}</span>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </div>
  );
}
