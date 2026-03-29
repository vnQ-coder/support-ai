/**
 * Working hours queries -- plain async functions called from Server Components.
 * All queries are scoped by organizationId for tenant isolation.
 */

import { db } from "@repo/db";
import { eq } from "drizzle-orm";
import { workingHours } from "../../../../packages/db/src/schema/working-hours";
import type { WeekSchedule, DaySchedule } from "../../../../packages/db/src/schema/working-hours";
import { randomUUID } from "crypto";

export type WorkingHoursConfig = typeof workingHours.$inferSelect;
export type { WeekSchedule, DaySchedule };

export async function getWorkingHours(orgId: string): Promise<WorkingHoursConfig | null> {
  const result = await db.select().from(workingHours).where(eq(workingHours.organizationId, orgId)).limit(1);
  return result[0] ?? null;
}

export async function upsertWorkingHours(orgId: string, data: { timezone: string; schedule: WeekSchedule; offHoursMessage: string; showExpectedResponseTime: boolean }): Promise<void> {
  const existing = await db.select().from(workingHours).where(eq(workingHours.organizationId, orgId)).limit(1);
  if (existing.length > 0) {
    await db.update(workingHours).set({ ...data, updatedAt: new Date() }).where(eq(workingHours.organizationId, orgId));
  } else {
    await db.insert(workingHours).values({ id: randomUUID(), organizationId: orgId, ...data });
  }
}

export function isWithinWorkingHours(schedule: WeekSchedule, timezone: string): boolean {
  try {
    const now = new Date();
    const localTime = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
    const day = localTime.find(p => p.type === "weekday")?.value?.toLowerCase() as keyof WeekSchedule | undefined;
    const hour = localTime.find(p => p.type === "hour")?.value;
    const minute = localTime.find(p => p.type === "minute")?.value;
    if (!day || !hour || !minute) return false;
    const daySchedule = schedule[day];
    if (!daySchedule?.enabled) return false;
    const currentMinutes = parseInt(hour) * 60 + parseInt(minute);
    const [startH, startM] = daySchedule.start.split(":").map(Number);
    const [endH, endM] = daySchedule.end.split(":").map(Number);
    const startMinutes = (startH ?? 0) * 60 + (startM ?? 0);
    const endMinutes = (endH ?? 0) * 60 + (endM ?? 0);
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } catch { return false; }
}
