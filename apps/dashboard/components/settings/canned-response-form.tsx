"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { updateCannedResponseAction } from "@/app/(dashboard)/settings/canned-responses/actions";
import type { CannedResponse } from "@/lib/queries/canned-responses";

interface CannedResponseFormProps {
  item: CannedResponse;
  onSaved?: () => void;
}

export function CannedResponseForm({ item, onSaved }: CannedResponseFormProps) {
  const [shortcut, setShortcut] = useState(item.shortcut);
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [isShared, setIsShared] = useState(item.isShared);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await updateCannedResponseAction(item.id, { shortcut, title, content, isShared });
        onSaved?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-shortcut-${item.id}`}>Shortcut</Label>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">/</span>
            <Input id={`edit-shortcut-${item.id}`} value={shortcut} onChange={e => setShortcut(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-title-${item.id}`}>Title</Label>
          <Input id={`edit-title-${item.id}`} value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`edit-content-${item.id}`}>Content <span className="text-muted-foreground text-xs">{content.length}/2000</span></Label>
        <Textarea id={`edit-content-${item.id}`} value={content} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)} rows={6} maxLength={2000} required />
      </div>
      <div className="flex items-center gap-2">
        <Switch id={`edit-shared-${item.id}`} checked={isShared} onCheckedChange={setIsShared} />
        <Label htmlFor={`edit-shared-${item.id}`} className="cursor-pointer">Shared with team</Label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit">Save Changes</Button>
    </form>
  );
}
