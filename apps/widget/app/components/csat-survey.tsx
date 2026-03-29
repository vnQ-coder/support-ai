"use client";

import { useState, useCallback } from "react";

type SurveyState = "rating" | "submitting" | "submitted" | "error";

interface CsatSurveyProps {
  conversationId: string;
  apiUrl: string;
  widgetKey: string;
  onDismiss: () => void;
}

const starLabels = ["Terrible", "Poor", "Okay", "Good", "Excellent"];

export function CsatSurvey({
  conversationId,
  apiUrl,
  widgetKey,
  onDismiss,
}: CsatSurveyProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [state, setState] = useState<SurveyState>("rating");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayScore = hoveredScore ?? selectedScore;

  const handleSubmit = useCallback(async () => {
    if (selectedScore === null) return;

    setState("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch(`${apiUrl}/api/v1/csat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          score: selectedScore,
          widgetKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data?.error?.message ?? "Failed to submit feedback. Please try again.";
        throw new Error(message);
      }

      setState("submitted");
    } catch (err) {
      setState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }, [selectedScore, apiUrl, conversationId, widgetKey]);

  // Thank you state
  if (state === "submitted") {
    return (
      <div className="mx-4 mb-2 rounded-xl border bg-green-50 dark:bg-green-950/20 p-4 animate-in slide-in-from-bottom-2 duration-300">
        <div className="text-center">
          <p className="text-sm font-medium text-green-900 dark:text-green-200">
            Thank you for your feedback!
          </p>
          <p className="mt-1 text-xs text-green-700 dark:text-green-400">
            Your response helps us improve our support.
          </p>
          <button
            onClick={onDismiss}
            className="mt-3 text-xs text-green-600 dark:text-green-400 underline underline-offset-2 hover:text-green-800 dark:hover:text-green-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-2 rounded-xl border bg-muted/50 p-4 animate-in slide-in-from-bottom-2 duration-300">
      <p className="text-sm font-medium text-foreground text-center">
        How was your experience?
      </p>

      {/* Star rating */}
      <div
        className="flex justify-center gap-1 mt-3"
        role="radiogroup"
        aria-label="Rate your experience from 1 to 5 stars"
      >
        {[1, 2, 3, 4, 5].map((score) => {
          const isFilled = displayScore !== null && score <= displayScore;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selectedScore === score}
              aria-label={`${score} star${score > 1 ? "s" : ""} - ${starLabels[score - 1]}`}
              onClick={() => setSelectedScore(score)}
              onMouseEnter={() => setHoveredScore(score)}
              onMouseLeave={() => setHoveredScore(null)}
              disabled={state === "submitting"}
              className="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isFilled ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={isFilled ? 0 : 1.5}
                className={`h-7 w-7 transition-colors ${
                  isFilled
                    ? "text-yellow-400"
                    : "text-muted-foreground/40"
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Label for hovered/selected score */}
      <p className="text-xs text-muted-foreground text-center mt-1 h-4">
        {displayScore !== null ? starLabels[displayScore - 1] : "\u00A0"}
      </p>

      {/* Error message */}
      {state === "error" && errorMessage && (
        <p className="text-xs text-red-500 text-center mt-2">{errorMessage}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 mt-3">
        <button
          onClick={onDismiss}
          disabled={state === "submitting"}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={selectedScore === null || state === "submitting"}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "submitting" ? "Sending..." : state === "error" ? "Retry" : "Submit"}
        </button>
      </div>
    </div>
  );
}
