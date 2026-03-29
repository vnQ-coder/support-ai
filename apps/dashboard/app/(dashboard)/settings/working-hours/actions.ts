"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthOrRedirect } from "@/lib/auth";
import { upsertWorkingHours } from "@/lib/queries/working-hours";
import type { WeekSchedule } from "@/lib/queries/working-hours";

const DaySchema = z.object({ enabled: z.boolean(), start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) });
const Schema = z.object({
  timezone: z.string().min(1),
  schedule: z.record(DaySchema),
  offHoursMessage: z.string().min(1).max(500),
  showExpectedResponseTime: z.boolean(),
});

export async function updateWorkingHoursAction(data: unknown) {
  const { internalOrgId } = await getAuthOrRedirect();
  const validated = Schema.parse(data);
  await upsertWorkingHours(internalOrgId, validated as { timezone: string; schedule: WeekSchedule; offHoursMessage: string; showExpectedResponseTime: boolean });
  revalidatePath("/settings/working-hours");
}
