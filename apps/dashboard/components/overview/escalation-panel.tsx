"use client";

import { AlertTriangle, UserPlus, ExternalLink } from "lucide-react";
import { formatRelativeTime } from "@/lib/dashboard-utils";

export interface EscalationSummary {
  totalEscalated: number;
  unassigned: number;
  conversations: Array<{
    id: string;
    subject: string;
    contactName: string;
    priority: string;
    assigneeName: string | null;
    escalatedAt: string;
  }>;
}

interface EscalationPanelProps {
  data: EscalationSummary;
}

const priorityStyles: Record<string, string> = {
  urgent:
    "bg-red-500/10 text-red-400 border-red-500/20",
  high:
    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium:
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low:
    "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export function EscalationPanel({ data }: EscalationPanelProps) {
  if (data.totalEscalated === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-medium text-muted-foreground">
            Escalation Queue
          </h3>
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
            {data.totalEscalated}
          </span>
          {data.unassigned > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
              {data.unassigned} unassigned
            </span>
          )}
        </div>
        <a
          href="/conversations?status=escalated"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Conversation list */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-border text-left text-xs text-muted-foreground">
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Subject</th>
              <th className="px-6 py-3 font-medium">Priority</th>
              <th className="px-6 py-3 font-medium">Waiting</th>
              <th className="px-6 py-3 font-medium">Assigned</th>
              <th className="px-6 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {data.conversations.map((conv) => (
              <tr
                key={conv.id}
                className="border-t border-border transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-medium">{conv.contactName}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm max-w-[200px] truncate">
                    {conv.subject}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                      priorityStyles[conv.priority] ?? priorityStyles.medium
                    }`}
                  >
                    {conv.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(new Date(conv.escalatedAt))}
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
                <td className="px-6 py-4">
                  {!conv.assigneeName && (
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      title="Quick assign"
                    >
                      <UserPlus className="h-3 w-3" />
                      Assign
                    </button>
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
