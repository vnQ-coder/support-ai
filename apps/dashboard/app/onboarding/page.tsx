"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";

// ---- Step indicator --------------------------------------------------------

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Welcome" },
    { num: 2, label: "Channels" },
    { num: 3, label: "Knowledge" },
    { num: 4, label: "Widget" },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              step.num === currentStep
                ? "bg-primary text-primary-foreground"
                : step.num < currentStep
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {step.num < currentStep ? (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              step.num
            )}
          </div>
          <span
            className={`hidden text-sm sm:inline ${
              step.num === currentStep
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div
              className={`h-px w-8 ${
                step.num < currentStep ? "bg-primary/40" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---- Channel card ----------------------------------------------------------

function ChannelCard({
  name,
  description,
  icon,
  href,
}: {
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <a
        href={href}
        className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Configure
      </a>
    </div>
  );
}

// ---- Step components -------------------------------------------------------

function StepWelcome({ orgName }: { orgName: string }) {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <svg
          className="h-8 w-8 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold tracking-tight">
        Welcome to SupportAI
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        Let&apos;s get <span className="font-semibold text-foreground">{orgName}</span> set
        up with AI-powered customer support. This will only take a few minutes.
      </p>
    </div>
  );
}

function StepChannels() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold tracking-tight">
          Connect a Channel
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Choose how your customers will reach you. You can add more channels
          later.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <ChannelCard
          name="Email"
          description="Resend integration"
          icon={
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
          }
          href="/settings/channels"
        />
        <ChannelCard
          name="WhatsApp"
          description="Twilio integration"
          icon={
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
          }
          href="/settings/channels"
        />
        <ChannelCard
          name="SMS"
          description="Twilio integration"
          icon={
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
          }
          href="/settings/channels"
        />
      </div>
    </div>
  );
}

function StepKnowledge() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold tracking-tight">
          Add Knowledge
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Upload your help docs, FAQs, or product documentation so the AI can
          answer questions accurately.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <svg
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium">Upload your first knowledge source</p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, TXT, Markdown, or paste a URL
          </p>
        </div>
        <a
          href="/knowledge"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to Knowledge Base
        </a>
      </div>
    </div>
  );
}

function StepWidget({ orgId }: { orgId: string }) {
  const snippet = `<script
  src="${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/widget.js"
  data-org-id="${orgId}"
  async
></script>`;

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold tracking-tight">
          Install the Widget
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Add this snippet to your website to enable the AI chat widget for your
          customers.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            Embed Script
          </span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(snippet);
            }}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Copy
          </button>
        </div>
        <pre className="overflow-x-auto p-4 text-sm text-muted-foreground font-mono leading-relaxed">
          {snippet}
        </pre>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Paste this before the closing <code className="font-mono">&lt;/body&gt;</code> tag
        on every page where you want the widget to appear.
      </p>
    </div>
  );
}

// ---- Checkout success banner ------------------------------------------------

function CheckoutSuccessBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <svg
            className="h-4 w-4 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-300">
            Payment confirmed!
          </p>
          <p className="text-xs text-emerald-400/70">
            Your subscription is active. Let&apos;s set up your account.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-1 text-emerald-400/60 hover:text-emerald-300 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ---- Main onboarding page --------------------------------------------------

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization } = useOrganization();
  const orgName = organization?.name ?? "your organization";
  const orgId = organization?.id ?? "your-org-id";

  // Show success banner if redirected from Stripe checkout
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      setShowCheckoutSuccess(true);
      // Clean the URL without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams]);

  function handleNext() {
    if (step < 4) {
      setStep(step + 1);
    } else {
      router.push("/overview");
    }
  }

  function handleSkip() {
    if (step < 4) {
      setStep(step + 1);
    } else {
      router.push("/overview");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Checkout success banner */}
      {showCheckoutSuccess && (
        <CheckoutSuccessBanner
          onDismiss={() => setShowCheckoutSuccess(false)}
        />
      )}

      {/* Progress */}
      <div className="space-y-2">
        <p className="text-center text-xs text-muted-foreground">
          Step {step} of 4
        </p>
        <StepIndicator currentStep={step} />
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        {step === 1 && <StepWelcome orgName={orgName} />}
        {step === 2 && <StepChannels />}
        {step === 3 && <StepKnowledge />}
        {step === 4 && <StepWidget orgId={orgId} />}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {step < 4 ? "Skip" : "Skip setup"}
        </button>
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {step < 4 ? "Next" : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
