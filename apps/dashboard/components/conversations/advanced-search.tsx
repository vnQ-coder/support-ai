"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, X, Search } from "lucide-react";
import type { Tag } from "@/lib/queries/tags";

interface AdvancedSearchProps {
  orgTags: Tag[];
  teamMembers: { id: string; name: string | null; email: string }[];
}

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "waiting", label: "Waiting" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
];

const CHANNELS = [
  { value: "web_chat", label: "Web Chat" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
];

export function AdvancedSearch({ orgTags, teamMembers }: AdvancedSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const push = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(sp.toString());
      params.delete("page");
      Object.entries(updates).forEach(([k, v]) => {
        if (v) {
          params.set(k, v);
        } else {
          params.delete(k);
        }
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [sp, router, pathname]
  );

  const q = sp.get("q") ?? "";
  const activeStatuses = sp.getAll("status");
  const activeChannels = sp.getAll("channel");
  const activeTags = sp.getAll("tagId");
  const assigneeId = sp.get("assigneeId") ?? "";

  const activeCount =
    activeStatuses.length +
    activeChannels.length +
    activeTags.length +
    (assigneeId ? 1 : 0);

  const [draftStatuses, setDraftStatuses] = useState(activeStatuses);
  const [draftChannels, setDraftChannels] = useState(activeChannels);
  const [draftTags, setDraftTags] = useState(activeTags);
  const [draftAssignee, setDraftAssignee] = useState(assigneeId);

  const applyFilters = (
    statuses: string[],
    channels: string[],
    filterTags: string[],
    assignee: string
  ) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    statuses.forEach((s) => params.append("status", s));
    channels.forEach((c) => params.append("channel", c));
    filterTags.forEach((t) => params.append("tagId", t));
    if (assignee) params.set("assigneeId", assignee);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            defaultValue={q}
            className="pl-9"
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                push({
                  q:
                    (e.target as HTMLInputElement).value || undefined,
                });
              }
            }}
          />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <Badge className="flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Status */}
              <div>
                <Label className="mb-3 block text-sm font-medium">
                  Status
                </Label>
                <div className="space-y-2">
                  {STATUSES.map((s) => (
                    <div key={s.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`status-${s.value}`}
                        checked={draftStatuses.includes(s.value)}
                        onCheckedChange={(c: boolean | "indeterminate") =>
                          setDraftStatuses(
                            c
                              ? [...draftStatuses, s.value]
                              : draftStatuses.filter((x) => x !== s.value)
                          )
                        }
                      />
                      <label
                        htmlFor={`status-${s.value}`}
                        className="cursor-pointer text-sm"
                      >
                        {s.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel */}
              <div>
                <Label className="mb-3 block text-sm font-medium">
                  Channel
                </Label>
                <div className="space-y-2">
                  {CHANNELS.map((c) => (
                    <div key={c.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`channel-${c.value}`}
                        checked={draftChannels.includes(c.value)}
                        onCheckedChange={(chk: boolean | "indeterminate") =>
                          setDraftChannels(
                            chk
                              ? [...draftChannels, c.value]
                              : draftChannels.filter((x) => x !== c.value)
                          )
                        }
                      />
                      <label
                        htmlFor={`channel-${c.value}`}
                        className="cursor-pointer text-sm"
                      >
                        {c.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labels */}
              {orgTags.length > 0 && (
                <div>
                  <Label className="mb-3 block text-sm font-medium">
                    Labels
                  </Label>
                  <div className="space-y-2">
                    {orgTags.map((tag) => (
                      <div key={tag.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={draftTags.includes(tag.id)}
                          onCheckedChange={(c: boolean | "indeterminate") =>
                            setDraftTags(
                              c
                                ? [...draftTags, tag.id]
                                : draftTags.filter((x) => x !== tag.id)
                            )
                          }
                        />
                        <label
                          htmlFor={`tag-${tag.id}`}
                          className="flex cursor-pointer items-center gap-1.5 text-sm"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignee */}
              <div>
                <Label className="mb-3 block text-sm font-medium">
                  Assigned to
                </Label>
                <Select value={draftAssignee} onValueChange={setDraftAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Anyone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Anyone</SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name ?? m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() =>
                    applyFilters(
                      draftStatuses,
                      draftChannels,
                      draftTags,
                      draftAssignee
                    )
                  }
                  className="flex-1"
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDraftStatuses([]);
                    setDraftChannels([]);
                    setDraftTags([]);
                    setDraftAssignee("");
                    applyFilters([], [], [], "");
                  }}
                >
                  Clear all
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active filter badges */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeStatuses.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1">
              {s}
              <button onClick={() => push({ status: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {activeChannels.map((c) => (
            <Badge key={c} variant="secondary" className="gap-1">
              {c}
              <button onClick={() => push({ channel: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {activeTags.map((tagId) => {
            const tag = orgTags.find((t) => t.id === tagId);
            return (
              <Badge key={tagId} variant="secondary" className="gap-1">
                {tag?.name ?? tagId}
                <button onClick={() => push({ tagId: undefined })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {assigneeId && (
            <Badge variant="secondary" className="gap-1">
              Assigned
              <button onClick={() => push({ assigneeId: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
