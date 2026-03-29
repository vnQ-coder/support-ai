import { describe, it, expect } from "vitest";
import {
  computeDateRange,
  calculateDelta,
  formatMetric,
  formatRelativeTime,
} from "../../apps/dashboard/lib/dashboard-utils";

describe("computeDateRange", () => {
  it("computes 7-day range correctly", () => {
    const result = computeDateRange("7d");
    const diffDays = Math.round(
      (result.current.to.getTime() - result.current.from.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThanOrEqual(7);
  });

  it("computes 30-day range correctly", () => {
    const result = computeDateRange("30d");
    const diffDays = Math.round(
      (result.current.to.getTime() - result.current.from.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThanOrEqual(30);
  });

  it("previous period ends before current period starts", () => {
    const result = computeDateRange("30d");
    expect(result.previous.to.getTime()).toBeLessThan(
      result.current.from.getTime()
    );
  });

  it("previous period has same length as current period", () => {
    const result = computeDateRange("7d");
    const currentLength =
      result.current.to.getTime() - result.current.from.getTime();
    const previousLength =
      result.previous.to.getTime() - result.previous.from.getTime();
    // Allow 1 day tolerance due to millisecond boundaries
    expect(Math.abs(currentLength - previousLength)).toBeLessThan(
      2 * 24 * 60 * 60 * 1000
    );
  });

  it("handles custom range", () => {
    const result = computeDateRange({
      from: "2024-01-01",
      to: "2024-01-31",
    });
    expect(result.current.from.getFullYear()).toBe(2024);
    expect(result.current.from.getMonth()).toBe(0);
  });
});

describe("calculateDelta", () => {
  it("returns positive delta for increase", () => {
    expect(calculateDelta(120, 100)).toBe(20);
  });

  it("returns negative delta for decrease", () => {
    expect(calculateDelta(80, 100)).toBe(-20);
  });

  it("returns 0 for no change", () => {
    expect(calculateDelta(100, 100)).toBe(0);
  });

  it("returns 100 when previous is 0 and current is positive", () => {
    expect(calculateDelta(50, 0)).toBe(100);
  });

  it("returns 0 when both are 0", () => {
    expect(calculateDelta(0, 0)).toBe(0);
  });
});

describe("formatMetric", () => {
  it("formats count under 10k normally", () => {
    expect(formatMetric(847, "count")).toBe("847");
  });

  it("abbreviates count over 10k", () => {
    expect(formatMetric(12400, "count")).toBe("12.4k");
  });

  it("formats percentage", () => {
    expect(formatMetric(62.3, "percentage")).toBe("62%");
  });

  it("formats hours under 100", () => {
    expect(formatMetric(71, "hours")).toBe("71h");
  });

  it("converts hours over 100 to days", () => {
    expect(formatMetric(120, "hours")).toBe("5.0 days");
  });

  it("formats CSAT score", () => {
    expect(formatMetric(4.3, "csat")).toBe("4.3");
  });

  it("formats zero CSAT as dash", () => {
    expect(formatMetric(0, "csat")).toBe("—");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'just now' for recent dates", () => {
    expect(formatRelativeTime(new Date())).toBe("just now");
  });

  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
  });

  it("returns days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
  });
});
