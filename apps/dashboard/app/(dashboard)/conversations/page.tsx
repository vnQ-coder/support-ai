import { Suspense } from "react";
import { getAuthOrRedirect } from "@/lib/auth";
import { getConversations } from "@/lib/queries/conversations";
import { ConversationList } from "@/components/conversations/conversation-list";
import { ConversationFilters } from "@/components/conversations/conversation-filters";
import { ConversationSearch } from "@/components/conversations/conversation-search";
import { ConversationsListPoller } from "@/components/conversations/conversations-list-poller";
import { Pagination } from "@/components/conversations/pagination";
import { ExportButton } from "@/components/export-button";

const VALID_STATUSES = new Set(["all", "active", "escalated", "waiting", "resolved"]);
const VALID_CHANNELS = new Set(["all", "web_chat", "email", "whatsapp"]);

interface ConversationsPageProps {
  searchParams: Promise<{
    status?: string;
    channel?: string;
    page?: string;
    q?: string;
  }>;
}

export default async function ConversationsPage({
  searchParams,
}: ConversationsPageProps) {
  const { internalOrgId } = await getAuthOrRedirect();
  const params = await searchParams;

  const status = VALID_STATUSES.has(params.status ?? "")
    ? params.status!
    : "all";
  const channel = VALID_CHANNELS.has(params.channel ?? "")
    ? params.channel!
    : "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const search = params.q?.trim() || undefined;

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
          <Suspense fallback={null}>
            <ConversationFilters />
          </Suspense>
        </div>
      </div>

      {/* Search */}
      <Suspense fallback={null}>
        <ConversationSearch />
      </Suspense>

      {/* Conversation List */}
      <Suspense fallback={<ListSkeleton />}>
        <ConversationListSection
          orgId={internalOrgId}
          status={status}
          channel={channel}
          page={page}
          search={search}
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
}: {
  orgId: string;
  status: string;
  channel: string;
  page: number;
  search?: string;
}) {
  const result = await getConversations(orgId, {
    status,
    channel,
    search,
    page,
    pageSize: 10,
  });

  if (result.total === 0 && search) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No conversations match your search
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ConversationList items={result.items} />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
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
