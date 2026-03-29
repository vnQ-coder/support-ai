import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthOrRedirect } from "@/lib/auth";
import {
  getConversationById,
  getConversationMessages,
  getTeamMembers,
} from "@/lib/queries/conversations";
import { getOrgTags, getConversationTags } from "@/lib/queries/tags";
import { MessageThread } from "@/components/conversations/message-thread";
import { ReplyComposer } from "@/components/conversations/reply-composer";
import { ConversationSidebar } from "@/components/conversations/conversation-sidebar";
import { ConversationPoller } from "@/components/conversations/conversation-poller";
import { StatusBadge } from "@/components/conversations/status-badge";
import { TagBadge } from "@/components/conversations/tag-badge";
import { TagSelector } from "@/components/conversations/tag-selector";
import {
  sendAgentReply,
  updateConversationStatus,
  assignConversation,
} from "./actions";

interface ConversationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const { internalOrgId } = await getAuthOrRedirect();
  const { id } = await params;

  // Fetch conversation, messages, team members, and tags in parallel
  const [conversation, msgs, teamMembers, orgTagsList, convTags] =
    await Promise.all([
      getConversationById(internalOrgId, id),
      getConversationMessages(id, internalOrgId),
      getTeamMembers(internalOrgId),
      getOrgTags(internalOrgId),
      getConversationTags(id, internalOrgId),
    ]);

  if (!conversation) {
    notFound();
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <Link
          href="/conversations"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold truncate">
              {conversation.subject ?? "No subject"}
            </h1>
            <StatusBadge status={conversation.status} />
            <ConversationPoller
              conversationId={conversation.id}
              lastMessageAt={conversation.updatedAt}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {conversation.contactName ?? "Unknown"} &middot;{" "}
            {conversation.contactEmail ?? "No email"}
          </p>
        </div>
      </div>

      {/* Body: Thread + Sidebar */}
      <div className="flex flex-1 overflow-hidden mt-4 rounded-xl border border-border bg-card">
        {/* Message area */}
        <div className="flex flex-1 flex-col min-w-0">
          <MessageThread messages={msgs} />
          <ReplyComposer
            conversationId={conversation.id}
            sendReplyAction={sendAgentReply}
          />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col">
          <ConversationSidebar
            conversation={conversation}
            teamMembers={teamMembers}
            updateStatusAction={updateConversationStatus}
            assignAction={assignConversation}
          />
          {/* Labels */}
          <div className="space-y-2 border-t border-border px-4 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Labels
            </p>
            <div className="flex flex-wrap gap-1.5">
              {convTags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
              <TagSelector
                conversationId={id}
                orgTags={orgTagsList}
                selectedTagIds={convTags.map((t) => t.id)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
