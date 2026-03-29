"use client";

import { formatRelativeTime } from "@/lib/dashboard-utils";
import type { EscalatedConversation } from "@/lib/queries/dashboard";
import { MessageSquare, Mail, ArrowRight } from "lucide-react";

interface NeedsAttentionTableProps {
  data: EscalatedConversation[];
}

const channelIcons: Record<string, React.ReactNode> = {
  web_chat: <MessageSquare className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
};

export function NeedsAttentionTable({ data }: NeedsAttentionTableProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-sm font-medium">No escalations</p>
        <p className="text-xs text-muted-foreground">
          Your AI is handling everything
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Needs Attention
        </h3>
        <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-border text-left text-xs text-muted-foreground">
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Subject</th>
              <th className="px-6 py-3 font-medium">Channel</th>
              <th className="px-6 py-3 font-medium">Waiting</th>
              <th className="px-6 py-3 font-medium">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {data.map((conv) => (
              <tr
                key={conv.id}
                className="border-t border-border transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium">{conv.contactName}</p>
                    <p className="text-xs text-muted-foreground">
                      {conv.contactEmail}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm max-w-[200px] truncate">
                    {conv.subject}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    {channelIcons[conv.channel] ?? null}
                    {conv.channel.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(new Date(conv.createdAt))}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {conv.assigneeName ? (
                    <span className="text-sm">{conv.assigneeName}</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                      Unassigned
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
