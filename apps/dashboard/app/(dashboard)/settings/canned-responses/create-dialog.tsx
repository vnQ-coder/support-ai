"use client";
import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { createCannedResponseAction } from "./actions";

export function CreateCannedResponseDialog() {
  const [open, setOpen] = useState(false);
  const [shortcut, setShortcut] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isShared, setIsShared] = useState(true);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await createCannedResponseAction({ shortcut, title, content, isShared });
        setShortcut(""); setTitle(""); setContent(""); setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> New Saved Reply</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Saved Reply</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="shortcut">Shortcut</Label>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">/</span>
                <Input id="shortcut" value={shortcut} onChange={e => setShortcut(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} placeholder="refund" required />
              </div>
              <p className="text-xs text-muted-foreground">Type /shortcut in the composer</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Refund policy" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content">Content <span className="text-muted-foreground text-xs">{content.length}/2000</span></Label>
            <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} placeholder="Our refund policy is..." rows={6} maxLength={2000} required />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="shared" checked={isShared} onCheckedChange={setIsShared} />
            <Label htmlFor="shared" className="cursor-pointer">Shared with team</Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Create Saved Reply</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
