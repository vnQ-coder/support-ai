"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { inviteMember } from "@/app/(dashboard)/settings/actions";

export function InviteMemberForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { success: boolean; error?: string } | null, formData: FormData) => {
      return inviteMember(formData);
    },
    null
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-medium text-foreground mb-4">
        Invite a New Member
      </h3>
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label
            htmlFor="invite-email"
            className="block text-xs font-medium text-muted-foreground"
          >
            Email Address
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="colleague@company.com"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="w-full sm:w-36 space-y-1.5">
          <label
            htmlFor="invite-role"
            className="block text-xs font-medium text-muted-foreground"
          >
            Role
          </label>
          <select
            id="invite-role"
            name="role"
            defaultValue="agent"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          {isPending ? "Inviting..." : "Invite"}
        </button>
      </form>

      {state?.error && (
        <div className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mt-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
          Invitation sent successfully.
        </div>
      )}
    </div>
  );
}
