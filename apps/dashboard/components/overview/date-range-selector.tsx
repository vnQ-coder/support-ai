"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { DateRangePreset } from "@/lib/dashboard-utils";

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

export function DateRangeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = (searchParams.get("range") as DateRangePreset) || "30d";

  const handleSelect = useCallback(
    (preset: DateRangePreset) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", preset);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => handleSelect(preset.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            currentRange === preset.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
