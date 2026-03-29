import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Calendar, MessageSquare } from "lucide-react";
import { getAuthOrRedirect } from "@/lib/auth";
import { getContact, getContactConversations } from "@/lib/queries/contacts";
import { StatusBadge } from "@/components/conversations/status-badge";
import { ChannelBadge } from "@/components/conversations/channel-badge";
import { formatRelativeTime } from "@/lib/dashboard-utils";

interface ContactDetailPageProps {
  params: Promise<{ contactId: string }>;
}

export default async function ContactDetailPage({
  params,
}: ContactDetailPageProps) {
  const { internalOrgId } = await getAuthOrRedirect();
  const { contactId } = await params;

  const [contact, contactConversations] = await Promise.all([
    getContact(internalOrgId, contactId),
    getContactConversations(internalOrgId, contactId),
  ]);

  if (!contact) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/contacts"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            {contact.name ?? "Unknown Contact"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {contact.email ?? "No email"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info Card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Contact Info
          </h2>

          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold">
              {getInitials(contact.name)}
            </div>
            <div>
              <p className="font-medium">{contact.name ?? "Unknown"}</p>
              {contact.email && (
                <p className="text-sm text-muted-foreground">{contact.email}</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 pt-2 border-t border-border">
            {contact.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{contact.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Customer since{" "}
                {new Date(contact.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>
                {contactConversations.length} conversation
                {contactConversations.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Notes / Tags (read-only placeholder) */}
          <div className="pt-2 border-t border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Notes
            </h3>
            <p className="text-sm text-muted-foreground italic">
              No notes yet
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Tags
            </h3>
            <p className="text-sm text-muted-foreground italic">
              No tags assigned
            </p>
          </div>
        </div>

        {/* Conversation History */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Conversation History
            </h2>
          </div>

          {contactConversations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No conversations yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Conversations with this contact will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {contactConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium truncate">
                        {conv.subject ?? "No subject"}
                      </p>
                      <StatusBadge status={conv.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <ChannelBadge channel={conv.channel} />
                      <span>
                        {conv.messageCount} message
                        {conv.messageCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {formatRelativeTime(new Date(conv.updatedAt))}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
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
