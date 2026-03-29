import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Check, Minus, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, predictable pricing for AI customer support. No per-resolution fees. Flat monthly rates starting at $49.",
};

/* -------------------------------------------------------------------------- */
/*                                   DATA                                     */
/* -------------------------------------------------------------------------- */

interface PlanColumn {
  name: string;
  price: string;
  description: string;
  cta: string;
  highlighted: boolean;
}

const plans: PlanColumn[] = [
  {
    name: "Starter",
    price: "$49",
    description: "For small teams getting started.",
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$99",
    description: "For growing teams.",
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$199",
    description: "For scaling companies.",
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations.",
    cta: "Contact sales",
    highlighted: false,
  },
];

interface FeatureRow {
  label: string;
  values: (string | boolean)[];
}

interface FeatureCategory {
  category: string;
  rows: FeatureRow[];
}

const comparisonData: FeatureCategory[] = [
  {
    category: "Usage",
    rows: [
      {
        label: "AI resolutions / month",
        values: ["500", "2,000", "10,000", "Custom"],
      },
      {
        label: "Knowledge sources",
        values: ["5", "25", "Unlimited", "Unlimited"],
      },
      {
        label: "Team members",
        values: ["2", "10", "Unlimited", "Unlimited"],
      },
      {
        label: "Conversation history",
        values: ["30 days", "90 days", "1 year", "Unlimited"],
      },
    ],
  },
  {
    category: "Channels",
    rows: [
      { label: "Web widget", values: [true, true, true, true] },
      { label: "Email", values: [false, true, true, true] },
      { label: "SMS", values: [false, true, true, true] },
      { label: "WhatsApp", values: [false, false, true, true] },
      { label: "Slack", values: [false, false, true, true] },
    ],
  },
  {
    category: "AI Features",
    rows: [
      { label: "Auto-resolution", values: [true, true, true, true] },
      { label: "Confidence scoring", values: [true, true, true, true] },
      { label: "Human handoff", values: [true, true, true, true] },
      { label: "Multi-language (30+)", values: [false, true, true, true] },
      { label: "Custom AI training", values: [false, false, true, true] },
      { label: "AI tone customization", values: [false, false, true, true] },
    ],
  },
  {
    category: "Analytics",
    rows: [
      { label: "Basic dashboard", values: [true, true, true, true] },
      { label: "CSAT tracking", values: [false, true, true, true] },
      { label: "Resolution analytics", values: [false, true, true, true] },
      { label: "Knowledge gap reports", values: [false, false, true, true] },
      { label: "Custom reports", values: [false, false, false, true] },
    ],
  },
  {
    category: "Support & Security",
    rows: [
      { label: "Email support", values: [true, true, true, true] },
      { label: "Priority support", values: [false, true, true, true] },
      { label: "Dedicated account manager", values: [false, false, false, true] },
      { label: "SSO / SAML", values: [false, false, true, true] },
      { label: "Custom SLA", values: [false, false, false, true] },
      { label: "On-premise option", values: [false, false, false, true] },
    ],
  },
  {
    category: "Integrations",
    rows: [
      { label: "API access", values: [false, false, true, true] },
      { label: "Webhooks", values: [false, true, true, true] },
      { label: "Custom integrations", values: [false, false, false, true] },
      { label: "Custom branding", values: [false, true, true, true] },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*                                COMPONENTS                                  */
/* -------------------------------------------------------------------------- */

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium">{value}</span>;
  }
  if (value) {
    return <Check className="mx-auto h-4 w-4 text-primary" />;
  }
  return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
}

/* -------------------------------------------------------------------------- */
/*                                   PAGE                                     */
/* -------------------------------------------------------------------------- */

export default function PricingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="hero-gradient px-6 pb-16 pt-24 text-center sm:pt-32">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Plans that{" "}
          <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            scale with you
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Start free, upgrade when you are ready. Every plan includes a 14-day
          free trial with no credit card required.
        </p>
      </section>

      {/* Plan cards (mobile-friendly summary) */}
      <section className="px-6 pb-16">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border p-6 ${
                plan.highlighted
                  ? "border-primary shadow-lg ring-1 ring-primary"
                  : "border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.price !== "Custom" && (
                  <span className="text-muted-foreground">/month</span>
                )}
              </div>
              <Link
                href={plan.name === "Enterprise" ? "/contact" : "/sign-up"}
                className={`mt-6 inline-flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-opacity hover:opacity-90 ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-secondary"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Full comparison table */}
      <section className="bg-secondary/30 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Compare all features
          </h2>

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[700px] text-left">
              {/* Table header */}
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    Features
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.name}
                      className={`px-6 py-4 text-center text-sm font-semibold ${
                        plan.highlighted ? "text-primary" : ""
                      }`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {comparisonData.map((section) => (
                  <Fragment key={section.category}>
                    {/* Category header */}
                    <tr
                      className="border-t border-border bg-secondary/50"
                    >
                      <td
                        colSpan={5}
                        className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {section.category}
                      </td>
                    </tr>

                    {/* Feature rows */}
                    {section.rows.map((row) => (
                      <tr
                        key={row.label}
                        className="border-t border-border/50"
                      >
                        <td className="px-6 py-3.5 text-sm">{row.label}</td>
                        {row.values.map((value, i) => (
                          <td
                            key={`${row.label}-${plans[i].name}`}
                            className={`px-6 py-3.5 text-center ${
                              plans[i].highlighted ? "bg-primary/[0.03]" : ""
                            }`}
                          >
                            <CellValue value={value} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ / CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Frequently asked questions
          </h2>

          <div className="mt-12 space-y-8 text-left">
            {[
              {
                q: "What counts as an AI resolution?",
                a: "An AI resolution is when SupportAI fully resolves a customer query without needing human intervention. Conversations that are escalated to your team do not count.",
              },
              {
                q: "Can I change plans at any time?",
                a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
              },
              {
                q: "Is there a free trial?",
                a: "Every plan includes a 14-day free trial with full access. No credit card required to start.",
              },
              {
                q: "What happens if I exceed my resolution limit?",
                a: "Your AI will continue working, but we will reach out to discuss upgrading your plan. We never charge overage fees.",
              },
              {
                q: "Do you offer annual billing?",
                a: "Yes. Annual billing is available with a 20% discount. Contact our sales team for details.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="text-base font-semibold">{faq.q}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Start your free trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
