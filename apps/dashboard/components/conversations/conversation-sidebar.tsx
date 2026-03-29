"use client";

import { useTransition } from "react";
import { ChannelBadge } from "./channel-badge";
import type { ConversationDetail, TeamMember } from "@/lib/queries/conversations";

interface ConversationSidebarProps {
  conversation: ConversationDetail;
  teamMembers: TeamMember[];
  updateStatusAction: (
    conversationId: string,
    status: string
  ) => Promise<{ error?: string }>;
  assignAction: (
    conversationId: string,
    assigneeId: string
  ) => Promise<{ error?: string }>;
}

const STATUS_OPTIONS = ["active", "waiting", "escalated", "resolved"] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ConversationSidebar({
  conversation,
  teamMembers,
  updateStatusAction,
  assignAction,
}: ConversationSidebarProps) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateStatusAction(conversation.id, status);
    });
  }

  function handleAssignChange(assigneeId: string) {
    startTransition(async () => {
      await assignAction(conversation.id, assigneeId);
    });
  }

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-card p-6 space-y-6 overflow-y-auto">
      {/* Contact Info */}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Contact
        </h3>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {conversation.contactName ?? "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">
            {conversation.contactEmail ?? "No email"}
          </p>
          <ChannelBadge channel={conversation.channel} />
          <p className="text-xs text-muted-foreground">
            Customer since {formatDate(conversation.contactCreatedAt)}
          </p>
        </div>
      </div>

      {/* Status Control */}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Status
        </h3>
        <select
          value={conversation.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isPending}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Assignee Control */}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Assigned To
        </h3>
        <select
          value={conversation.assigneeId ?? ""}
          onChange={(e) => handleAssignChange(e.target.value)}
          disabled={isPending}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          <option value="">Unassigned</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name ?? member.email}
            </option>
          ))}
        </select>
      </div>

      {/* Conversation Meta */}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Details
        </h3>
        <dl className="space-y-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="text-foreground">{formatDate(conversation.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last Updated</dt>
            <dd className="text-foreground">{formatDate(conversation.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Conversation ID</dt>
            <dd className="text-foreground font-mono">{conversation.id}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
