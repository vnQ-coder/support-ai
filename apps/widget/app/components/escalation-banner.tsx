"use client";

import { useState, useEffect } from "react";
import { Users, Loader2, CheckCircle2 } from "lucide-react";

type EscalationState = "offer" | "connecting" | "connected";

interface EscalationBannerProps {
  /** Called when user confirms they want a human agent */
  onRequestHuman: () => void;
  /** Called when user dismisses the escalation offer */
  onDismiss: () => void;
  /** Name of the assigned agent, if available */
  agentName?: string | null;
  /** Whether escalation is currently in progress */
  isEscalating?: boolean;
}

export function EscalationBanner({
  onRequestHuman,
  onDismiss,
  agentName,
  isEscalating = false,
}: EscalationBannerProps) {
  const [state, setState] = useState<EscalationState>("offer");
  const [estimatedWait, setEstimatedWait] = useState<string>("~2 min");

  // Transition states based on props
  useEffect(() => {
    if (isEscalating) {
      setState("connecting");
    }
  }, [isEscalating]);

  useEffect(() => {
    if (agentName) {
      setState("connected");
    }
  }, [agentName]);

  // Simulate estimated wait time countdown when connecting
  useEffect(() => {
    if (state !== "connecting") return;

    const waits = ["~2 min", "~1 min", "Less than a minute"];
    let index = 0;

    const interval = setInterval(() => {
      index = Math.min(index + 1, waits.length - 1);
      setEstimatedWait(waits[index]!);
    }, 15000);

    return () => clearInterval(interval);
  }, [state]);

  // Offer state: ask user if they want a human
  if (state === "offer") {
    return (
      <div className="mx-4 mb-2 rounded-xl border bg-amber-50 dark:bg-amber-950/20 p-3 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Would you like to speak with a human?
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              A support agent can help with your question.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setState("connecting");
                  onRequestHuman();
                }}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
              >
                Yes, connect me
              </button>
              <button
                onClick={onDismiss}
                className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                No, this helped
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Connecting state: spinner + estimated wait
  if (state === "connecting") {
    return (
      <div className="mx-4 mb-2 rounded-xl border bg-blue-50 dark:bg-blue-950/20 p-3 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Connecting you with a human agent...
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              Estimated wait: {estimatedWait}
            </p>
            <div className="mt-2 h-1 w-full rounded-full bg-blue-200 dark:bg-blue-800 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Connected state: show assigned agent
  return (
    <div className="mx-4 mb-2 rounded-xl border bg-green-50 dark:bg-green-950/20 p-3 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900 dark:text-green-200">
            Connected with {agentName ?? "a support agent"}
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
            They can see your conversation history and will respond shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
