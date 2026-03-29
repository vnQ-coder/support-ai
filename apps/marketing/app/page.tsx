import Link from "next/link";
import type { Metadata } from "next";
import {
  Sparkles,
  Zap,
  ArrowRightLeft,
  Mail,
  MessageSquare,
  Smartphone,
  Hash,
  Check,
  ArrowRight,
  Building2,
  ShoppingCart,
  Headphones,
  GraduationCap,
  HeartPulse,
  Plane,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SupportAI — AI Customer Support That Just Works",
};

/* -------------------------------------------------------------------------- */
/*                                   DATA                                     */
/* -------------------------------------------------------------------------- */

const features = [
  {
    icon: Sparkles,
    title: "AI Accuracy",
    description:
      "Powered by the latest LLMs with RAG over your knowledge base. Resolves 60%+ of tickets on day one with confidence scoring and automatic escalation.",
  },
  {
    icon: Zap,
    title: "5-Minute Setup",
    description:
      "Paste one script tag and you are live. Import your help docs, connect your channels, and let AI start resolving tickets immediately.",
  },
  {
    icon: ArrowRightLeft,
    title: "Seamless Human Handoff",
    description:
      "When AI is not confident, it escalates to your team with full conversation context. No customer ever gets stuck in a loop.",
  },
] as const;

const pricingPlans = [
  {
    name: "Starter",
    price: "$49",
    description: "For small teams getting started with AI support.",
    features: [
      "500 AI resolutions/mo",
      "1 channel (web widget)",
      "Basic analytics",
      "Email support",
      "5 knowledge sources",
    ],
    highlighted: false,
    cta: "Start free trial",
  },
  {
    name: "Growth",
    price: "$99",
    description: "For growing teams that need multi-channel support.",
    features: [
      "2,000 AI resolutions/mo",
      "All channels (web, email, SMS)",
      "Advanced analytics",
      "Priority support",
      "25 knowledge sources",
      "Custom branding",
      "Team collaboration",
    ],
    highlighted: true,
    cta: "Start free trial",
  },
  {
    name: "Pro",
    price: "$199",
    description: "For scaling companies with high ticket volumes.",
    features: [
      "10,000 AI resolutions/mo",
      "All channels + WhatsApp",
      "Full analytics suite",
      "Dedicated support",
      "Unlimited knowledge sources",
      "Custom branding",
      "API access",
      "SSO / SAML",
    ],
    highlighted: false,
    cta: "Start free trial",
  },
] as const;

const integrations = [
  { icon: Mail, label: "Email" },
  { icon: MessageSquare, label: "Slack" },
  { icon: Smartphone, label: "WhatsApp" },
  { icon: Hash, label: "SMS" },
] as const;

const industries = [
  { icon: Building2, label: "SaaS" },
  { icon: ShoppingCart, label: "E-commerce" },
  { icon: Headphones, label: "Support teams" },
  { icon: GraduationCap, label: "EdTech" },
  { icon: HeartPulse, label: "HealthTech" },
  { icon: Plane, label: "Travel" },
] as const;

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3000";

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/*  HERO                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="hero-gradient flex flex-col items-center justify-center px-6 pb-20 pt-24 text-center sm:pt-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Now in public beta
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
          AI support that{" "}
          <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            never sleeps
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Resolve 60% of support tickets automatically. Flat-rate pricing,
          5-minute setup, 30+ languages. No per-resolution surprises.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href={`${dashboardUrl}/sign-up`}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Start free trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/features"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium transition-colors hover:bg-secondary"
          >
            See how it works
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  SOCIAL PROOF                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-border bg-secondary/30 px-6 py-14">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Trusted by 500+ companies across industries
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {industries.map((industry) => (
              <div
                key={industry.label}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <industry.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{industry.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FEATURES                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
                automate support
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Built for teams that want accurate AI, predictable costs, and
              zero customer frustration.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
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

          <div className="mt-12 text-center">
            <Link
              href="/features"
              className="inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all features
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  PRICING                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section id="pricing" className="bg-secondary/30 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Simple, predictable pricing
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              No per-resolution fees. No per-seat surprises. Just flat monthly
              rates that scale with you.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border bg-card p-8 ${
                  plan.highlighted
                    ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary"
                    : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                    Most popular
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`${dashboardUrl}/sign-up`}
                  className={`mt-8 inline-flex h-11 items-center justify-center rounded-lg text-sm font-medium transition-opacity hover:opacity-90 ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-background hover:bg-secondary"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Enterprise callout */}
          <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border bg-card p-8 text-center">
            <h3 className="text-lg font-semibold">Enterprise</h3>
            <p className="mt-2 text-muted-foreground">
              Custom resolution limits, dedicated account manager, SLA
              guarantees, on-premise deployment options, and custom
              integrations.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  INTEGRATIONS                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section id="integrations" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Connect every channel
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Meet your customers where they are. SupportAI works across all
            major communication channels.
          </p>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-8">
            {integrations.map((integration) => (
              <div
                key={integration.label}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-10 py-8 transition-shadow hover:shadow-md hover:shadow-primary/5"
              >
                <integration.icon className="h-8 w-8 text-foreground" />
                <span className="text-sm font-medium">
                  {integration.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/integrations"
              className="inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all integrations
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FINAL CTA                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="hero-gradient border-t border-border px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to{" "}
            <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
              automate your support
            </span>
            ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Join 500+ companies using SupportAI. Set up in under 5 minutes,
            cancel any time.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`${dashboardUrl}/sign-up`}
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
