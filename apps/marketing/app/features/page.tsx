import Link from "next/link";
import type { Metadata } from "next";
import {
  Sparkles,
  Zap,
  ArrowRightLeft,
  Globe,
  BarChart3,
  BookOpen,
  ArrowRight,
  Shield,
  Clock,
  Languages,
  Puzzle,
  BrainCircuit,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Everything you need to automate customer support with AI. RAG-powered responses, instant setup, smart human handoff, multi-channel, analytics, and knowledge base management.",
};

const heroFeatures = [
  {
    icon: Sparkles,
    title: "AI-Powered Responses",
    description:
      "Our RAG pipeline retrieves relevant knowledge base content and generates accurate responses with 95%+ accuracy. Confidence scoring ensures every answer meets your quality bar before reaching customers.",
    highlights: [
      "Retrieval Augmented Generation (RAG)",
      "Confidence scoring on every response",
      "Automatic escalation when uncertain",
      "Learns from your docs, not generic data",
    ],
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "Go from sign-up to live AI support in under 5 minutes. Paste a single script tag into your site, upload your help docs, and your AI agent starts resolving tickets immediately. No engineering team required.",
    highlights: [
      "One-line embed code",
      "Drag-and-drop knowledge upload",
      "Zero coding required",
      "Live in under 5 minutes",
    ],
  },
  {
    icon: ArrowRightLeft,
    title: "Smart Human Handoff",
    description:
      "When AI is not confident, conversations are seamlessly escalated to your team with full context. Agents see the entire conversation history, knowledge base sources cited, and the AI confidence score.",
    highlights: [
      "Full context transfer to agents",
      "Configurable confidence thresholds",
      "Priority-based routing",
      "No customer ever gets stuck in a loop",
    ],
  },
  {
    icon: Globe,
    title: "Multi-Channel Support",
    description:
      "Manage email, WhatsApp, SMS, and your web widget from a single unified inbox. Every channel gets the same AI quality, the same knowledge base, and the same seamless escalation flow.",
    highlights: [
      "Web widget, email, WhatsApp, SMS",
      "Unified inbox for all channels",
      "Consistent AI across every channel",
      "Channel-specific customization",
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics and Insights",
    description:
      "Real-time dashboards show CSAT scores, resolution rates, response times, and volume trends. Identify knowledge gaps, track AI performance, and make data-driven decisions about your support operations.",
    highlights: [
      "Real-time CSAT tracking",
      "Resolution rate analytics",
      "Volume trend visualization",
      "Knowledge gap identification",
    ],
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description:
      "Upload PDFs, paste URLs, or write text directly. Content is automatically chunked, embedded with vector search, and indexed for instant retrieval. Keep your knowledge base current with easy updates.",
    highlights: [
      "PDF, URL, and text support",
      "Auto-chunking and vector indexing",
      "Version history on updates",
      "Instant retrieval via pgvector",
    ],
  },
] as const;

const additionalFeatures = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant with row-level tenant isolation, encryption at rest and in transit, SSO/SAML, and audit logging.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description:
      "Your AI agent never sleeps, never takes breaks, and responds in under 2 seconds. Support your customers around the clock.",
  },
  {
    icon: Languages,
    title: "30+ Languages",
    description:
      "Respond to customers in their preferred language automatically. No separate knowledge bases needed per language.",
  },
  {
    icon: Puzzle,
    title: "API and Webhooks",
    description:
      "Build custom workflows with our REST API and real-time webhooks. Integrate with any tool in your stack.",
  },
  {
    icon: BrainCircuit,
    title: "Custom AI Training",
    description:
      "Fine-tune response tone, adjust confidence thresholds, and set custom escalation rules to match your brand voice.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Internal notes, conversation assignments, collision detection, and shared views keep your team aligned.",
  },
] as const;

export default function FeaturesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="hero-gradient px-6 pb-20 pt-24 text-center sm:pt-32">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Everything you need to{" "}
          <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            automate support
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          SupportAI combines retrieval-augmented generation, multi-channel
          messaging, and intelligent human handoff into one platform that works
          out of the box.
        </p>
      </section>

      {/* Main features — alternating layout */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl space-y-32">
          {heroFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex flex-col items-center gap-12 lg:flex-row ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Text */}
              <div className="flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                  {feature.title}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <ul className="mt-8 space-y-3">
                  {feature.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      </span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mockup placeholder */}
              <div className="flex-1">
                <div className="aspect-[4/3] rounded-2xl border border-border bg-card p-8">
                  <div className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60">
                    <feature.icon className="h-12 w-12 text-muted-foreground/30" />
                    <span className="text-sm text-muted-foreground/50">
                      {feature.title} preview
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Additional features grid */}
      <section className="bg-secondary/30 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              And so much more
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Every feature is built for production workloads, enterprise
              security, and global scale.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See it in action
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Start your 14-day free trial. No credit card required. Set up in
            under 5 minutes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Start free trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
