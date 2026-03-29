"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeMember } from "@/app/(dashboard)/settings/actions";
import type { MemberRow } from "@/lib/queries/settings";

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-amber-500/10 text-amber-400",
  admin: "bg-blue-500/10 text-blue-400",
  agent: "bg-emerald-500/10 text-emerald-400",
};

interface TeamMemberListProps {
  members: MemberRow[];
}

export function TeamMemberList({ members }: TeamMemberListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove(memberId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeMember(memberId);
      if (!result.success) {
        setError(result.error ?? "Failed to remove member");
      }
      setConfirmId(null);
    });
  }

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No team members yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {member.name ?? "Pending"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ${
                        ROLE_STYLES[member.role] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {confirmId === member.id ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleRemove(member.id)}
                          disabled={isPending}
                          className="rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                        >
                          {isPending ? "Removing..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          disabled={isPending}
                          className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(member.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
