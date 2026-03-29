"use client";

import { useState, useTransition } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, Tag } from "lucide-react";
import {
  addTagAction,
  removeTagAction,
} from "@/app/(dashboard)/conversations/[id]/actions";
import type { Tag as TagType } from "@/lib/queries/tags";

interface TagSelectorProps {
  conversationId: string;
  orgTags: TagType[];
  selectedTagIds: string[];
}

export function TagSelector({
  conversationId,
  orgTags,
  selectedTagIds,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedTagIds)
  );
  const [, startTransition] = useTransition();

  const toggle = (tagId: string) => {
    const isSelected = selected.has(tagId);
    const next = new Set(selected);
    if (isSelected) {
      next.delete(tagId);
    } else {
      next.add(tagId);
    }
    setSelected(next);
    startTransition(async () => {
      if (isSelected) {
        await removeTagAction(conversationId, tagId);
      } else {
        await addTagAction(conversationId, tagId);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Tag className="h-3 w-3" /> Add label
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search labels..." className="h-8" />
          <CommandList>
            <CommandEmpty>No labels found.</CommandEmpty>
            {orgTags.map((tag) => (
              <CommandItem
                key={tag.id}
                onSelect={() => toggle(tag.id)}
                className="cursor-pointer"
              >
                <div
                  className="mr-2 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 text-sm">{tag.name}</span>
                {selected.has(tag.id) && (
                  <Check className="h-3 w-3 text-primary" />
                )}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
