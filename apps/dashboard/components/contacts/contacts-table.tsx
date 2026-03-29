"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/dashboard-utils";
import { ChannelBadge } from "@/components/conversations/channel-badge";
import type { ContactListItem } from "@/lib/queries/contacts";

interface ContactsTableProps {
  items: ContactListItem[];
}

export function ContactsTable({ items }: ContactsTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Channel</th>
              <th className="px-6 py-3 font-medium text-center">
                Conversations
              </th>
              <th className="px-6 py-3 font-medium text-right">
                Last Contact
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((contact) => (
              <tr
                key={contact.id}
                className="border-t border-border transition-colors hover:bg-muted/50"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="flex items-center gap-3"
                  >
                    {/* Avatar */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {getInitials(contact.name)}
                    </div>
                    <span className="text-sm font-medium">
                      {contact.name ?? "Unknown"}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/contacts/${contact.id}`} className="block">
                    <span className="text-sm text-muted-foreground">
                      {contact.email ?? "No email"}
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <ChannelBadge channel={contact.channel} />
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {contact.conversationCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(new Date(contact.lastContactAt))}
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

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
