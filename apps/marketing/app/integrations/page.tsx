import Link from "next/link";
import type { Metadata } from "next";
import {
  Mail,
  Smartphone,
  MessageSquare,
  Hash,
  Zap,
  ArrowRight,
  Link2,
  Building2,
  Headphones,
  BarChart3,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Connect SupportAI to your entire support stack. Email, WhatsApp, SMS, Slack, Zapier, Salesforce, HubSpot, and more.",
};

interface Integration {
  name: string;
  description: string;
  icon: typeof Mail;
  color: string;
  status: "available" | "coming-soon";
}

const integrations: Integration[] = [
  {
    name: "Email",
    description:
      "Forward support emails to SupportAI. AI responds automatically or escalates to your team. Powered by Resend for reliable delivery.",
    icon: Mail,
    color: "text-blue-400",
    status: "available",
  },
  {
    name: "WhatsApp",
    description:
      "Connect your WhatsApp Business number. Customers get instant AI-powered responses in their favorite messaging app.",
    icon: Smartphone,
    color: "text-green-400",
    status: "available",
  },
  {
    name: "SMS",
    description:
      "Two-way SMS support via Twilio. Perfect for transactional updates, shipping queries, and quick customer questions.",
    icon: Hash,
    color: "text-yellow-400",
    status: "available",
  },
  {
    name: "Slack",
    description:
      "Get escalation notifications in Slack. Your team can respond to flagged conversations without leaving their workspace.",
    icon: MessageSquare,
    color: "text-purple-400",
    status: "coming-soon",
  },
  {
    name: "Zapier",
    description:
      "Connect SupportAI to 5,000+ apps. Trigger workflows, sync data, and automate your entire support pipeline.",
    icon: Zap,
    color: "text-orange-400",
    status: "coming-soon",
  },
  {
    name: "Salesforce",
    description:
      "Sync customer data and conversation history with Salesforce CRM. Give your sales team full visibility into support interactions.",
    icon: Building2,
    color: "text-sky-400",
    status: "coming-soon",
  },
  {
    name: "HubSpot",
    description:
      "Connect customer support data to your HubSpot CRM. Track support tickets alongside deals and marketing touchpoints.",
    icon: BarChart3,
    color: "text-orange-300",
    status: "coming-soon",
  },
  {
    name: "Intercom",
    description:
      "Migrate from Intercom or run SupportAI alongside it. Import your existing knowledge base and conversation history.",
    icon: Headphones,
    color: "text-indigo-400",
    status: "coming-soon",
  },
];

export default function IntegrationsPage() {
  const available = integrations.filter((i) => i.status === "available");
  const comingSoon = integrations.filter((i) => i.status === "coming-soon");

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="hero-gradient px-6 pb-20 pt-24 text-center sm:pt-32">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Connect your entire{" "}
          <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            support stack
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          SupportAI integrates with the tools your team already uses. Manage
          every channel from one unified platform.
        </p>
      </section>

      {/* Available integrations */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Available now
          </h2>
          <p className="mt-2 text-muted-foreground">
            These integrations are live and ready to use today.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((integration) => (
              <div
                key={integration.name}
                className="group rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <integration.icon
                      className={`h-6 w-6 ${integration.color}`}
                    />
                  </div>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    Available
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold">
                  {integration.name}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {integration.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section className="bg-secondary/30 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Coming soon
          </h2>
          <p className="mt-2 text-muted-foreground">
            These integrations are in development. Request early access to get
            notified.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {comingSoon.map((integration) => (
              <div
                key={integration.name}
                className="rounded-xl border border-border bg-card p-8 opacity-80 transition-opacity hover:opacity-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <integration.icon
                      className={`h-6 w-6 ${integration.color}`}
                    />
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                    Coming Soon
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold">
                  {integration.name}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {integration.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request integration CTA */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Link2 className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Need a different integration?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            We are building new integrations every month. Tell us what you need
            and we will prioritize it.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Request an integration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium transition-colors hover:bg-secondary"
            >
              View API docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
