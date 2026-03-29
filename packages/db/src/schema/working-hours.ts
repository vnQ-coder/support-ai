import { pgTable, text, timestamp, boolean, varchar, jsonb } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export type DaySchedule = { enabled: boolean; start: string; end: string };
export type WeekSchedule = Record<"monday"|"tuesday"|"wednesday"|"thursday"|"friday"|"saturday"|"sunday", DaySchedule>;

export const workingHours = pgTable("working_hours", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id).unique().notNull(),
  timezone: varchar("timezone", { length: 100 }).notNull().default("America/New_York"),
  schedule: jsonb("schedule").$type<WeekSchedule>().notNull().default({
    monday:    { enabled: true,  start: "09:00", end: "17:00" },
    tuesday:   { enabled: true,  start: "09:00", end: "17:00" },
    wednesday: { enabled: true,  start: "09:00", end: "17:00" },
    thursday:  { enabled: true,  start: "09:00", end: "17:00" },
    friday:    { enabled: true,  start: "09:00", end: "17:00" },
    saturday:  { enabled: false, start: "10:00", end: "14:00" },
    sunday:    { enabled: false, start: "10:00", end: "14:00" },
  }),
  offHoursMessage: text("off_hours_message").notNull().default(
    "Thanks for reaching out! Our team is currently offline. We'll get back to you during business hours."
  ),
  showExpectedResponseTime: boolean("show_expected_response_time").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
