import Link from "next/link";
import { MessageSquare, BookOpen, Users } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Connect your first inbox",
    description: "Add web chat, email, or WhatsApp to start receiving messages.",
    href: "/settings/channels",
  },
  {
    icon: BookOpen,
    title: "Upload knowledge base docs",
    description: "Train your AI with help articles, FAQs, and documentation.",
    href: "/settings/knowledge",
  },
  {
    icon: Users,
    title: "Invite your team",
    description: "Add support agents to handle escalated conversations.",
    href: "/settings/team",
  },
];

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">
        Welcome to SupportAI
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-10">
        Get started in under 5 minutes. Complete these steps to activate your AI
        support agent.
      </p>
      <div className="grid gap-4 w-full max-w-lg">
        {steps.map((step, i) => (
          <Link
            key={i}
            href={step.href}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <step.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {step.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
