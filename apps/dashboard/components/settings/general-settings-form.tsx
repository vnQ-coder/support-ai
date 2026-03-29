"use client";

import { useActionState } from "react";
import { updateOrganization } from "@/app/(dashboard)/settings/actions";
import type { OrganizationRow } from "@/lib/queries/settings";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter ($49/mo)",
  professional: "Professional ($99/mo)",
  business: "Business ($199/mo)",
  enterprise: "Enterprise (Custom)",
};

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "UTC",
];

interface GeneralSettingsFormProps {
  org: OrganizationRow;
}

export function GeneralSettingsForm({ org }: GeneralSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { success: boolean; error?: string } | null, formData: FormData) => {
      return updateOrganization(formData);
    },
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Organization Name */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground"
          >
            Organization Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={org.name}
            required
            minLength={2}
            maxLength={255}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Organization Slug (read-only) */}
        <div className="space-y-2">
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-foreground"
          >
            Organization Slug
          </label>
          <input
            id="slug"
            type="text"
            value={org.slug}
            readOnly
            disabled
            className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            The slug cannot be changed after creation.
          </p>
        </div>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Current Plan
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {PLAN_LABELS[org.plan] ?? org.plan}
            </p>
          </div>
          <a
            href="/settings/billing"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Upgrade Plan
          </a>
        </div>
      </div>

      {/* Timezone & Business Hours */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-foreground"
          >
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            defaultValue="America/New_York"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Business Hours
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Only route to human agents during business hours
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              name="businessHoursEnabled"
              value="true"
              defaultChecked={false}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-foreground after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>
        {/* Hidden fallback for unchecked */}
        <input type="hidden" name="businessHoursEnabled" value="false" />
      </div>

      {/* Feedback and submit */}
      {state?.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          Settings saved successfully.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
