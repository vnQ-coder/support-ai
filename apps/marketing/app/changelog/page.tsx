import type { Metadata } from "next";
import {
  Sparkles,
  BarChart3,
  CreditCard,
  MessageSquare,
  BookOpen,
  Bot,
  Users,
  Globe,
  Smartphone,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "See what is new in SupportAI. Product updates, new features, and improvements shipped by the team.",
};

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: {
    type: "added" | "improved" | "fixed";
    text: string;
    icon: typeof Sparkles;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "v1.3.0",
    date: "March 29, 2026",
    title: "Real-time updates, contacts, and CSAT collection",
    description:
      "This release brings real-time conversation updates via WebSocket, a dedicated contacts page for managing customer profiles, and in-conversation CSAT collection.",
    changes: [
      {
        type: "added",
        text: "Real-time conversation updates with live typing indicators",
        icon: Sparkles,
      },
      {
        type: "added",
        text: "Contacts page with customer profile management and conversation history",
        icon: Users,
      },
      {
        type: "added",
        text: "In-conversation CSAT collection with emoji-based rating",
        icon: MessageSquare,
      },
      {
        type: "improved",
        text: "Conversation list now updates instantly without page refresh",
        icon: Globe,
      },
    ],
  },
  {
    version: "v1.2.0",
    date: "March 28, 2026",
    title: "Analytics dashboard, billing, and multi-channel messaging",
    description:
      "Major release adding the analytics dashboard with real-time metrics, Stripe-powered billing management, and WhatsApp/SMS support via Twilio.",
    changes: [
      {
        type: "added",
        text: "Analytics dashboard with resolution rates, CSAT scores, and volume trends",
        icon: BarChart3,
      },
      {
        type: "added",
        text: "Billing page with Stripe integration for subscription management",
        icon: CreditCard,
      },
      {
        type: "added",
        text: "WhatsApp and SMS channels via Twilio integration",
        icon: Smartphone,
      },
      {
        type: "improved",
        text: "Knowledge base upload speed increased by 3x with parallel processing",
        icon: BookOpen,
      },
    ],
  },
  {
    version: "v1.1.0",
    date: "March 15, 2026",
    title: "Knowledge base with vector search and RAG pipeline",
    description:
      "Introduced the knowledge base system with PDF/URL/text upload, automatic chunking, pgvector indexing, and the core RAG pipeline for AI-powered responses.",
    changes: [
      {
        type: "added",
        text: "Knowledge base with PDF, URL, and text content support",
        icon: BookOpen,
      },
      {
        type: "added",
        text: "Vector search with pgvector for semantic document retrieval",
        icon: Sparkles,
      },
      {
        type: "added",
        text: "RAG pipeline with confidence scoring and source citations",
        icon: Bot,
      },
      {
        type: "improved",
        text: "AI response quality with retrieved context grounding",
        icon: MessageSquare,
      },
    ],
  },
  {
    version: "v1.0.0",
    date: "March 1, 2026",
    title: "Initial launch",
    description:
      "The first public release of SupportAI. Includes the AI chat widget, email channel support, basic dashboard with conversation management, and the foundation of the platform.",
    changes: [
      {
        type: "added",
        text: "AI-powered chat widget with embeddable script tag",
        icon: Bot,
      },
      {
        type: "added",
        text: "Email channel with automatic AI responses",
        icon: MessageSquare,
      },
      {
        type: "added",
        text: "Dashboard with conversation list, detail view, and team management",
        icon: BarChart3,
      },
      {
        type: "added",
        text: "Human handoff with configurable confidence thresholds",
        icon: Users,
      },
    ],
  },
];

function TypeBadge({ type }: { type: "added" | "improved" | "fixed" }) {
  const styles = {
    added: "text-emerald-400 bg-emerald-400/10",
    improved: "text-violet-400 bg-violet-400/10",
    fixed: "text-blue-400 bg-blue-400/10",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[type]}`}
    >
      {type}
    </span>
  );
}

export default function ChangelogPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border px-6 pb-12 pt-24 text-center sm:pt-28">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Changelog
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Everything new in SupportAI. Product updates shipped by the team,
          newest first.
        </p>
      </section>

      {/* Timeline */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="relative space-y-16 border-l-2 border-border pl-8">
            {changelog.map((entry) => (
              <div key={entry.version} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[calc(2rem+5px)] flex h-3 w-3 items-center justify-center">
                  <span className="h-3 w-3 rounded-full bg-primary" />
                </div>

                {/* Version & date */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                    {entry.version}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {entry.date}
                  </span>
                </div>

                {/* Title & description */}
                <h2 className="mt-4 text-2xl font-bold tracking-tight">
                  {entry.title}
                </h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {entry.description}
                </p>

                {/* Changes */}
                <ul className="mt-6 space-y-3">
                  {entry.changes.map((change) => (
                    <li
                      key={change.text}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
                    >
                      <change.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="flex flex-1 flex-wrap items-start gap-2">
                        <TypeBadge type={change.type} />
                        <span className="text-sm">{change.text}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
