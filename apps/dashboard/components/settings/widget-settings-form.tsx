"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateWidgetConfig } from "@/app/(dashboard)/settings/actions";
import { MessageSquare, X } from "lucide-react";

interface WidgetConfig {
  primaryColor: string;
  greeting: string;
  placeholder: string;
  position: string;
  showBranding: boolean;
  allowedDomains: string[];
}

interface WidgetSettingsFormProps {
  config: WidgetConfig;
}

export function WidgetSettingsForm({ config }: WidgetSettingsFormProps) {
  const [color, setColor] = useState(config.primaryColor);
  const [greeting, setGreeting] = useState(config.greeting);
  const [placeholder, setPlaceholder] = useState(config.placeholder);
  const [position, setPosition] = useState(config.position);
  const [showBranding, setShowBranding] = useState(config.showBranding);
  const [domains, setDomains] = useState<string[]>(config.allowedDomains);
  const [domainInput, setDomainInput] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (_prev: { success: boolean; error?: string } | null, formData: FormData) => {
      return updateWidgetConfig(formData);
    },
    null
  );

  function addDomain() {
    const trimmed = domainInput.trim();
    if (trimmed && !domains.includes(trimmed)) {
      setDomains((prev) => [...prev, trimmed]);
      setDomainInput("");
    }
  }

  function removeDomain(domain: string) {
    setDomains((prev) => prev.filter((d) => d !== domain));
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      {/* Form */}
      <form action={formAction} className="flex-1 space-y-6">
        {/* Hidden fields for controlled state */}
        <input type="hidden" name="primaryColor" value={color} />
        <input type="hidden" name="showBranding" value={showBranding ? "true" : "false"} />
        <input type="hidden" name="allowedDomains" value={domains.join("\n")} />

        {/* Color picker */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border border-border"
                style={{ backgroundColor: color }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
                maxLength={7}
                className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="greeting"
              className="block text-sm font-medium text-foreground"
            >
              Greeting Message
            </label>
            <textarea
              id="greeting"
              name="greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="placeholder"
              className="block text-sm font-medium text-foreground"
            >
              Input Placeholder
            </label>
            <input
              id="placeholder"
              name="placeholder"
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              maxLength={200}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Position & Branding */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="position"
              className="block text-sm font-medium text-foreground"
            >
              Widget Position
            </label>
            <select
              id="position"
              name="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Show Branding
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Display &quot;Powered by SupportAI&quot; in the widget
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={showBranding}
                onChange={(e) => setShowBranding(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-foreground after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>
        </div>

        {/* Allowed Domains */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Allowed Domains
            </label>
            <p className="text-xs text-muted-foreground">
              Only these domains can embed your widget. Leave empty to allow all.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDomain();
                  }
                }}
                placeholder="example.com"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={addDomain}
                className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Add
              </button>
            </div>
            {domains.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {domains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {domain}
                    <button
                      type="button"
                      onClick={() => removeDomain(domain)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feedback */}
        {state?.error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            Widget settings saved successfully.
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Live Preview */}
      <div className="w-full xl:w-80 shrink-0">
        <div className="sticky top-8">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Preview
          </h3>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {/* Mini widget preview */}
            <div className="relative rounded-lg bg-background border border-border overflow-hidden" style={{ minHeight: 280 }}>
              {/* Chat header */}
              <div
                className="px-4 py-3 text-white text-sm font-medium"
                style={{ backgroundColor: color }}
              >
                SupportAI
              </div>

              {/* Chat body */}
              <div className="p-4 space-y-3">
                {/* Greeting message */}
                <div className="flex gap-2">
                  <div
                    className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <MessageSquare className="h-3 w-3 text-white" />
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2 text-xs text-foreground max-w-[180px]">
                    {greeting}
                  </div>
                </div>
              </div>

              {/* Input area */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
                <div className="rounded-lg border border-input bg-background px-3 py-2 text-xs text-muted-foreground">
                  {placeholder}
                </div>
              </div>
            </div>

            {/* Branding */}
            {showBranding && (
              <p className="text-center text-[10px] text-muted-foreground">
                Powered by SupportAI
              </p>
            )}

            {/* Position indicator */}
            <p className="text-center text-xs text-muted-foreground">
              Position: {position === "bottom-right" ? "Bottom Right" : "Bottom Left"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
