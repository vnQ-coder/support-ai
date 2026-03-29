import { Suspense } from "react";
import { getAuthOrRedirect } from "@/lib/auth";
import { getTeamMembers } from "@/lib/queries/conversations";
import { getOrgTags } from "@/lib/queries/tags";
import { searchConversations } from "@/lib/queries/search";
import { ConversationList } from "@/components/conversations/conversation-list";
import { AdvancedSearch } from "@/components/conversations/advanced-search";
import { ConversationsListPoller } from "@/components/conversations/conversations-list-poller";
import { Pagination } from "@/components/conversations/pagination";
import { ExportButton } from "@/components/export-button";

const VALID_STATUSES = new Set(["all", "active", "escalated", "waiting", "resolved"]);
const VALID_CHANNELS = new Set(["all", "web_chat", "email", "whatsapp"]);

interface ConversationsPageProps {
  searchParams: Promise<{
    status?: string | string[];
    channel?: string | string[];
    page?: string;
    q?: string;
    tagId?: string | string[];
    assigneeId?: string;
  }>;
}

export default async function ConversationsPage({
  searchParams,
}: ConversationsPageProps) {
  const { internalOrgId } = await getAuthOrRedirect();
  const params = await searchParams;

  // Normalize params that may be string or string[]
  const statusRaw = Array.isArray(params.status) ? params.status[0] : params.status;
  const channelRaw = Array.isArray(params.channel) ? params.channel[0] : params.channel;
  const status = VALID_STATUSES.has(statusRaw ?? "") ? statusRaw! : "all";
  const channel = VALID_CHANNELS.has(channelRaw ?? "") ? channelRaw! : "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const search = params.q?.trim() || undefined;
  const tagIds = params.tagId
    ? Array.isArray(params.tagId)
      ? params.tagId
      : [params.tagId]
    : [];
  const assigneeId = params.assigneeId ?? undefined;

  // Fetch tags and team members for filters
  const [orgTagsList, teamMembersList] = await Promise.all([
    getOrgTags(internalOrgId),
    getTeamMembers(internalOrgId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer conversations across all channels
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ExportButton
            endpoint="/api/export/conversations"
            filename={`conversations-export`}
            label="Export CSV"
            params={{
              from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              to: new Date().toISOString(),
              ...(status !== "all" ? { status } : {}),
            }}
          />
          <ConversationsListPoller />
        </div>
      </div>

      {/* Advanced Search + Filters */}
      <Suspense fallback={null}>
        <AdvancedSearch orgTags={orgTagsList} teamMembers={teamMembersList} />
      </Suspense>

      {/* Conversation List */}
      <Suspense fallback={<ListSkeleton />}>
        <ConversationListSection
          orgId={internalOrgId}
          status={status}
          channel={channel}
          page={page}
          search={search}
          tagIds={tagIds}
          assigneeId={assigneeId}
        />
      </Suspense>
    </div>
  );
}

async function ConversationListSection({
  orgId,
  status,
  channel,
  page,
  search,
  tagIds,
  assigneeId,
}: {
  orgId: string;
  status: string;
  channel: string;
  page: number;
  search?: string;
  tagIds?: string[];
  assigneeId?: string;
}) {
  const result = await searchConversations(orgId, {
    query: search,
    status: status !== "all" ? status : undefined,
    channel: channel !== "all" ? channel : undefined,
    tagIds,
    assigneeId,
    page,
    limit: 10,
  });

  const totalPages = Math.ceil(result.total / result.limit);

  if (result.total === 0 && search) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No conversations match your search
        </p>
      </div>
    );
  }

  if (result.total === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No conversations found
        </p>
      </div>
    );
  }

  // Map search result shape to ConversationList expected shape
  const items = result.conversations.map((c) => ({
    id: c.id,
    subject: c.subject,
    channel: c.channel,
    status: c.status,
    contactName: c.contactName,
    contactEmail: c.contactEmail,
    assigneeName: c.assigneeName,
    lastMessageAt: c.updatedAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <ConversationList items={items} />
      <Pagination
        page={result.page}
        totalPages={totalPages}
        total={result.total}
      />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
