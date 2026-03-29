import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Heart, Zap, Shield, Lightbulb } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "SupportAI is on a mission to give every company enterprise-grade AI customer support. Learn about our team, values, and vision.",
};

const values = [
  {
    icon: Zap,
    title: "Speed",
    description:
      "We obsess over response times — for our customers and theirs. From 5-minute setup to sub-2-second AI responses, speed is in our DNA.",
  },
  {
    icon: Shield,
    title: "Accuracy",
    description:
      "AI that hallucinates is worse than no AI at all. Our confidence scoring and RAG pipeline ensure every response is grounded in your actual knowledge base.",
  },
  {
    icon: Heart,
    title: "Trust",
    description:
      "We earn trust through transparent pricing, data privacy, and always giving customers a path to a human. No lock-in, no hidden fees, no dark patterns.",
  },
  {
    icon: Lightbulb,
    title: "Simplicity",
    description:
      "Enterprise-grade does not have to mean enterprise-complex. We strip away unnecessary configuration so you can focus on your customers, not our software.",
  },
] as const;

const team = [
  {
    name: "Sarah Chen",
    role: "Co-founder & CEO",
    initials: "SC",
    bio: "Previously VP of Engineering at a Series C support platform. Spent 10 years building tools that help teams scale.",
  },
  {
    name: "Marcus Johnson",
    role: "Co-founder & CTO",
    initials: "MJ",
    bio: "Former ML engineer at a major AI lab. Built retrieval systems serving millions of queries per day.",
  },
  {
    name: "Priya Patel",
    role: "Head of Product",
    initials: "PP",
    bio: "Led product at two successful B2B SaaS companies. Passionate about reducing complexity in enterprise software.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="hero-gradient px-6 pb-20 pt-24 text-center sm:pt-32">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          We believe every company deserves{" "}
          <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            enterprise-grade AI support
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          SupportAI was founded on a simple observation: the best AI support
          tools are locked behind six-figure contracts. We are changing that
          with flat-rate pricing and zero-config setup.
        </p>
      </section>

      {/* Mission */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Our mission
          </h2>
          <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              Customer support is the front line of every business. When a
              customer reaches out, they deserve a fast, accurate, and empathetic
              response — whether that comes from AI or a human.
            </p>
            <p>
              Most AI support tools either price out small teams with
              per-resolution fees or deliver unreliable responses that erode
              customer trust. We built SupportAI to solve both problems:
              predictable flat-rate pricing and RAG-powered accuracy that
              actually works.
            </p>
            <p>
              Our goal is to automate the repetitive 60% of support so your
              team can focus on the complex 40% that requires human empathy and
              judgment. No customer should ever feel stuck talking to a bot that
              does not understand them.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary/30 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Our values
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              These principles guide every product decision, every line of code,
              and every customer interaction.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-border bg-card p-8"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <value.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Meet the team
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              A small, focused team of engineers and product people who have
              been building support tools for over a decade.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-xl border border-border bg-card p-8 text-center"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-emerald-500/20 text-2xl font-bold text-primary">
                  {member.initials}
                </div>
                <h3 className="mt-6 text-lg font-semibold">{member.name}</h3>
                <p className="mt-1 text-sm font-medium text-primary">
                  {member.role}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring CTA */}
      <section className="border-t border-border bg-secondary/30 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            We are hiring
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            We are looking for engineers, designers, and go-to-market people
            who want to build the future of AI-powered customer support.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Get in touch
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
