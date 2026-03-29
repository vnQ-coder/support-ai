import { getAuthOrRedirect } from "@/lib/auth";
import { getChannelConfigs } from "@/lib/queries/channels";

// ---- Channel status badge --------------------------------------------------

function StatusBadge({ configured }: { configured: boolean }) {
  if (configured) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      Not configured
    </span>
  );
}

// ---- Channel card ----------------------------------------------------------

function ChannelCard({
  name,
  provider,
  description,
  configured,
  icon,
}: {
  name: string;
  provider: string;
  description: string;
  configured: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{name}</h3>
              <StatusBadge configured={configured} />
            </div>
            <p className="text-xs text-muted-foreground">{provider}</p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {configured ? "Manage" : "Configure"}
        </button>
      </div>
    </div>
  );
}

// ---- Email icon ------------------------------------------------------------

function EmailIcon() {
  return (
    <svg
      className="h-5 w-5 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

// ---- WhatsApp icon ---------------------------------------------------------

function WhatsAppIcon() {
  return (
    <svg
      className="h-5 w-5 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    </svg>
  );
}

// ---- SMS icon --------------------------------------------------------------

function SmsIcon() {
  return (
    <svg
      className="h-5 w-5 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
      />
    </svg>
  );
}

// ---- Page ------------------------------------------------------------------

export default async function ChannelsSettingsPage() {
  const { internalOrgId } = await getAuthOrRedirect();
  const channelConfig = await getChannelConfigs(internalOrgId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Channels</h2>
        <p className="text-sm text-muted-foreground">
          Connect and manage your customer communication channels
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
        <ChannelCard
          name="Email"
          provider="Resend"
          description="Receive and reply to customer emails. Requires a Resend API key and verified domain."
          configured={channelConfig.emailConfigured}
          icon={<EmailIcon />}
        />
        <ChannelCard
          name="WhatsApp"
          provider="Twilio"
          description="Handle WhatsApp conversations with AI-powered responses and human handoff."
          configured={channelConfig.whatsappConfigured}
          icon={<WhatsAppIcon />}
        />
        <ChannelCard
          name="SMS"
          provider="Twilio"
          description="Send and receive SMS messages. Requires a Twilio account and phone number."
          configured={channelConfig.smsConfigured}
          icon={<SmsIcon />}
        />
      </div>
    </div>
  );
}
