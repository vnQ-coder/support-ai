"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/dashboard-utils";
import { StatusBadge } from "./status-badge";
import { ChannelBadge } from "./channel-badge";
import type { ConversationListItem } from "@/lib/queries/conversations";

interface ConversationListProps {
  items: ConversationListItem[];
}

export function ConversationList({ items }: ConversationListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No conversations found
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Subject</th>
              <th className="px-6 py-3 font-medium">Channel</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Assigned</th>
              <th className="px-6 py-3 font-medium text-right">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((conv) => (
              <tr
                key={conv.id}
                className="border-t border-border transition-colors hover:bg-muted/50"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/conversations/${conv.id}`}
                    className="block"
                  >
                    <p className="text-sm font-medium">
                      {conv.contactName ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {conv.contactEmail ?? ""}
                    </p>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/conversations/${conv.id}`}
                    className="block"
                  >
                    <p className="max-w-[250px] truncate text-sm">
                      {conv.subject ?? "No subject"}
                    </p>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <ChannelBadge channel={conv.channel} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={conv.status} />
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
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(new Date(conv.lastMessageAt))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
