"use client";

import type { HourlyVolumeItem } from "@/lib/queries/analytics";

interface VolumeHeatmapProps {
  data: HourlyVolumeItem[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12a";
  if (i < 12) return `${i}a`;
  if (i === 12) return "12p";
  return `${i - 12}p`;
});

function getIntensityClass(value: number, max: number): string {
  if (max === 0) return "bg-muted/30";
  const ratio = value / max;
  if (ratio === 0) return "bg-muted/30";
  if (ratio < 0.2) return "bg-chart-1/20";
  if (ratio < 0.4) return "bg-chart-1/40";
  if (ratio < 0.6) return "bg-chart-1/60";
  if (ratio < 0.8) return "bg-chart-1/80";
  return "bg-chart-1";
}

export function VolumeHeatmap({ data }: VolumeHeatmapProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  // Build a 7x24 grid lookup
  const grid = new Map(
    data.map((d) => [`${d.dayOfWeek}-${d.hour}`, d.count])
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-sm text-muted-foreground">
          No volume data for this period
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Conversation Volume by Hour
      </h3>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Hour labels */}
          <div className="mb-1 flex">
            <div className="w-10 shrink-0" />
            {HOUR_LABELS.map((label, i) => (
              <div
                key={i}
                className="flex-1 text-center text-[10px] text-muted-foreground"
              >
                {i % 3 === 0 ? label : ""}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {DAY_LABELS.map((day, dayIdx) => (
            <div key={dayIdx} className="mb-0.5 flex items-center">
              <div className="w-10 shrink-0 text-xs text-muted-foreground">
                {day}
              </div>
              <div className="flex flex-1 gap-0.5">
                {Array.from({ length: 24 }, (_, hour) => {
                  const value = grid.get(`${dayIdx}-${hour}`) ?? 0;
                  return (
                    <div
                      key={hour}
                      className={`flex-1 rounded-sm ${getIntensityClass(value, max)} transition-colors`}
                      style={{ aspectRatio: "1", minHeight: "16px" }}
                      title={`${day} ${HOUR_LABELS[hour]}: ${value} conversations`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-1">
            <span className="mr-1 text-[10px] text-muted-foreground">
              Less
            </span>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => (
              <div
                key={ratio}
                className={`h-3 w-3 rounded-sm ${getIntensityClass(ratio * max, max)}`}
              />
            ))}
            <span className="ml-1 text-[10px] text-muted-foreground">
              More
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
