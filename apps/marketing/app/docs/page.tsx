import Link from "next/link";
import type { Metadata } from "next";
import {
  BookOpen,
  Rocket,
  Globe,
  Code,
  ArrowRight,
  FileText,
  Upload,
  Settings,
  Play,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Get started with SupportAI in under 5 minutes. Install the widget, upload your knowledge base, configure channels, and go live.",
};

const sidebarSections = [
  {
    title: "Getting Started",
    icon: Rocket,
    links: [
      { label: "Quick Start Guide", href: "#quick-start", active: true },
      { label: "Installation", href: "#step-1" },
      { label: "Knowledge Base", href: "#step-2" },
      { label: "Going Live", href: "#step-4" },
    ],
  },
  {
    title: "Channels",
    icon: Globe,
    links: [
      { label: "Web Widget", href: "#widget" },
      { label: "Email", href: "#email" },
      { label: "WhatsApp", href: "#whatsapp" },
      { label: "SMS", href: "#sms" },
    ],
  },
  {
    title: "API Reference",
    icon: Code,
    links: [
      { label: "Authentication", href: "#auth" },
      { label: "Conversations", href: "#conversations" },
      { label: "Knowledge Base", href: "#kb-api" },
      { label: "Webhooks", href: "#webhooks" },
    ],
  },
] as const;

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Create your account and install the widget",
    description:
      "Sign up for a free trial, then add our widget to your site with a single script tag. The widget automatically inherits your site styles and works on mobile.",
    code: `<!-- Add this before </body> -->
<script
  src="https://widget.supportai.dev/v1/loader.js"
  data-org-id="YOUR_ORG_ID"
  data-theme="auto"
  async
></script>`,
  },
  {
    number: "02",
    icon: Upload,
    title: "Upload your knowledge base",
    description:
      "Drag and drop PDFs, paste URLs to your help center, or write content directly. SupportAI automatically chunks, embeds, and indexes everything for instant retrieval.",
    code: `# Using the API
curl -X POST https://api.supportai.dev/v1/knowledge \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "url",
    "source": "https://docs.yourapp.com/faq",
    "auto_sync": true
  }'`,
  },
  {
    number: "03",
    icon: Settings,
    title: "Configure your channels",
    description:
      "Connect email forwarding, add your WhatsApp Business number, or set up SMS. Each channel connects in under 2 minutes through our dashboard.",
    code: `# Channel configuration via API
curl -X POST https://api.supportai.dev/v1/channels \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "email",
    "forward_address": "support@yourcompany.com",
    "auto_respond": true
  }'`,
  },
  {
    number: "04",
    icon: Play,
    title: "Go live",
    description:
      "Toggle your AI agent to live mode. It starts resolving customer queries instantly using your knowledge base. Monitor performance in real-time from your dashboard.",
    code: `# Verify your setup
curl https://api.supportai.dev/v1/health \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Response
{
  "status": "active",
  "channels": ["widget", "email"],
  "knowledge_sources": 12,
  "avg_response_time": "1.2s"
}`,
  },
] as const;

export default function DocsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border px-6 pb-12 pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            Documentation
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Quick Start Guide
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Get SupportAI running on your site in under 5 minutes. Four steps
            from sign-up to live AI support.
          </p>
        </div>
      </section>

      {/* Sidebar + Content */}
      <section className="px-6 py-16">
        <div className="mx-auto flex max-w-7xl gap-12">
          {/* Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <nav className="sticky top-24 space-y-8">
              {sidebarSections.map((section) => (
                <div key={section.title}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <section.icon className="h-4 w-4 text-primary" />
                    {section.title}
                  </h3>
                  <ul className="mt-3 space-y-2 border-l border-border pl-4">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className={`block text-sm transition-colors ${
                            link.active
                              ? "font-medium text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            <div id="quick-start" className="space-y-20">
              {steps.map((step) => (
                <div
                  key={step.number}
                  id={`step-${step.number === "01" ? "1" : step.number === "02" ? "2" : step.number === "03" ? "3" : "4"}`}
                  className="scroll-mt-24"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card font-mono text-sm font-bold text-primary">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold tracking-tight">
                        {step.title}
                      </h2>
                      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                          <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                          <span className="ml-2 text-xs text-muted-foreground">
                            Terminal
                          </span>
                        </div>
                        <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-foreground/90">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Next steps */}
            <div className="mt-20 rounded-xl border border-border bg-card p-8">
              <h3 className="text-xl font-bold">What is next?</h3>
              <p className="mt-2 text-muted-foreground">
                Once you are live, explore these resources to get the most out
                of SupportAI.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link
                  href="/features"
                  className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
                >
                  <Rocket className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-semibold">Explore features</div>
                    <div className="text-xs text-muted-foreground">
                      See everything SupportAI can do
                    </div>
                  </div>
                </Link>
                <Link
                  href="/integrations"
                  className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
                >
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-semibold">
                      Connect channels
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Set up email, WhatsApp, SMS
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-secondary/30 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Create your account and have AI support live in under 5 minutes.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Start free trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
