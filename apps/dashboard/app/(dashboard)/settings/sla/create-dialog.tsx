"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { createSlaPolicyAction } from "./actions";

export function CreateSlaDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [firstResponseMinutes, setFirstResponseMinutes] = useState("60");
  const [resolutionMinutes, setResolutionMinutes] = useState("480");
  const [priority, setPriority] = useState("normal");
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setFirstResponseMinutes("60");
    setResolutionMinutes("480");
    setPriority("normal");
    setIsDefault(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await createSlaPolicyAction({
        name: name.trim(),
        description: description.trim() || undefined,
        firstResponseMinutes: Number(firstResponseMinutes),
        resolutionMinutes: Number(resolutionMinutes),
        priority,
        isDefault,
      });

      if (result.success) {
        resetForm();
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Create Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create SLA Policy</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="sla-name">Name</Label>
            <Input
              id="sla-name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              placeholder="e.g. Standard SLA"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="sla-description">Description (optional)</Label>
            <Input
              id="sla-description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDescription(e.target.value)
              }
              placeholder="Brief description of this policy"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* First Response Time */}
          <div className="space-y-1.5">
            <Label htmlFor="sla-first-response">
              First Response Time (minutes)
            </Label>
            <Input
              id="sla-first-response"
              type="number"
              min={1}
              max={10080}
              value={firstResponseMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFirstResponseMinutes(e.target.value)
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Max time to first agent response (e.g. 60 = 1 hour)
            </p>
          </div>

          {/* Resolution Time */}
          <div className="space-y-1.5">
            <Label htmlFor="sla-resolution">Resolution Time (minutes)</Label>
            <Input
              id="sla-resolution"
              type="number"
              min={1}
              max={43200}
              value={resolutionMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setResolutionMinutes(e.target.value)
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Max time to resolve the conversation (e.g. 480 = 8 hours)
            </p>
          </div>

          {/* Default switch */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="sla-default" className="text-sm font-medium">
                Set as default
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically apply to new conversations
              </p>
            </div>
            <Switch
              id="sla-default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create Policy"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
