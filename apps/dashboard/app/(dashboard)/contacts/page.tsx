import { Suspense } from "react";
import { Users } from "lucide-react";
import { getAuthOrRedirect } from "@/lib/auth";
import { getContacts } from "@/lib/queries/contacts";
import { EmptyState } from "@repo/ui";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactsSearch } from "@/components/contacts/contacts-search";
import { ContactsPagination } from "@/components/contacts/contacts-pagination";

interface ContactsPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function ContactsPage({
  searchParams,
}: ContactsPageProps) {
  const { internalOrgId } = await getAuthOrRedirect();
  const params = await searchParams;

  const search = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your customers across all channels
          </p>
        </div>
        <Suspense fallback={null}>
          <ContactsSearch />
        </Suspense>
      </div>

      {/* Contacts Table */}
      <Suspense fallback={<TableSkeleton />}>
        <ContactsSection orgId={internalOrgId} search={search} page={page} />
      </Suspense>
    </div>
  );
}

async function ContactsSection({
  orgId,
  search,
  page,
}: {
  orgId: string;
  search: string;
  page: number;
}) {
  const result = await getContacts(orgId, {
    search: search || undefined,
    page,
    limit: 20,
  });

  if (result.total === 0 && !search) {
    return (
      <EmptyState
        icon={Users}
        title="No contacts yet"
        description="Contacts will appear here once customers start conversations through your support channels."
      />
    );
  }

  if (result.total === 0 && search) {
    return (
      <EmptyState
        icon={Users}
        title="No contacts found"
        description={`No contacts match "${search}". Try a different search term.`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <ContactsTable items={result.items} />
      <ContactsPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-12 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
