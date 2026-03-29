"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  Mail,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
} from "lucide-react";

const subjects = [
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "partnership", label: "Partnership" },
  { value: "press", label: "Press" },
] as const;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // No real backend -- just show success state
    setSubmitted(true);
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border px-6 pb-12 pt-24 text-center sm:pt-28">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Get in touch
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Have a question about SupportAI? Want to discuss a partnership?
          We would love to hear from you.
        </p>
      </section>

      {/* Two-column layout */}
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-5xl gap-16 lg:grid-cols-2">
          {/* Contact form */}
          <div>
            {submitted ? (
              <div className="flex flex-col items-center rounded-xl border border-border bg-card p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                  <CheckCircle2 className="h-7 w-7 text-accent" />
                </div>
                <h2 className="mt-6 text-2xl font-bold">Message sent</h2>
                <p className="mt-3 text-muted-foreground">
                  Thank you for reaching out. We typically respond within 4
                  hours during business days. Check your inbox for a
                  confirmation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Your name"
                      className="h-11 w-full rounded-lg border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@company.com"
                      className="h-11 w-full rounded-lg border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="company"
                    className="mb-2 block text-sm font-medium"
                  >
                    Company
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="Your company name"
                    className="h-11 w-full rounded-lg border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-medium"
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a subject
                    </option>
                    {subjects.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-medium"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="How can we help?"
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:w-auto sm:px-8"
                >
                  Send message
                  <Send className="ml-2 h-4 w-4" />
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-8 lg:pl-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Contact information
              </h2>
              <p className="mt-2 text-muted-foreground">
                Prefer email? Reach out directly and we will get back to you.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Email</h3>
                  <a
                    href="mailto:support@supportai.dev"
                    className="mt-1 text-sm text-primary hover:underline"
                  >
                    support@supportai.dev
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Response time</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Under 4 hours during business days (9 AM - 6 PM EST)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Office</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    123 Innovation Drive, Suite 400
                    <br />
                    Wilmington, DE 19801
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold">Enterprise inquiries</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Looking for custom resolution limits, dedicated support, or
                on-premise deployment? Our enterprise team can build a plan
                tailored to your needs.
              </p>
              <a
                href="mailto:enterprise@supportai.dev"
                className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
              >
                enterprise@supportai.dev
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
