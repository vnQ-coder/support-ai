"use client";
import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateWorkingHoursAction } from "@/app/(dashboard)/settings/working-hours/actions";
import type { WorkingHoursConfig } from "@/lib/queries/working-hours";
import type { WeekSchedule, DaySchedule } from "@/lib/queries/working-hours";

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
const DAY_LABELS: Record<typeof DAYS[number], string> = { monday:"Monday",tuesday:"Tuesday",wednesday:"Wednesday",thursday:"Thursday",friday:"Friday",saturday:"Saturday",sunday:"Sunday" };

const TIMEZONES = ["America/New_York","America/Chicago","America/Denver","America/Los_Angeles","Europe/London","Europe/Paris","Europe/Berlin","Europe/Amsterdam","Asia/Tokyo","Asia/Shanghai","Asia/Singapore","Asia/Kolkata","Asia/Dubai","Australia/Sydney","Pacific/Auckland","UTC"];

// Generate 30-min interval times
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0");
  const m = (i % 2 === 0 ? "00" : "30");
  return `${h}:${m}`;
});

const DEFAULT_SCHEDULE: WeekSchedule = {
  monday:    { enabled: true,  start: "09:00", end: "17:00" },
  tuesday:   { enabled: true,  start: "09:00", end: "17:00" },
  wednesday: { enabled: true,  start: "09:00", end: "17:00" },
  thursday:  { enabled: true,  start: "09:00", end: "17:00" },
  friday:    { enabled: true,  start: "09:00", end: "17:00" },
  saturday:  { enabled: false, start: "10:00", end: "14:00" },
  sunday:    { enabled: false, start: "10:00", end: "14:00" },
};

interface WorkingHoursFormProps {
  defaultValues: WorkingHoursConfig | null;
}

export function WorkingHoursForm({ defaultValues }: WorkingHoursFormProps) {
  const [timezone, setTimezone] = useState(defaultValues?.timezone ?? "America/New_York");
  const [schedule, setSchedule] = useState<WeekSchedule>((defaultValues?.schedule as WeekSchedule) ?? DEFAULT_SCHEDULE);
  const [message, setMessage] = useState(defaultValues?.offHoursMessage ?? "Thanks for reaching out! Our team is currently offline. We'll get back to you during business hours.");
  const [showETA, setShowETA] = useState(defaultValues?.showExpectedResponseTime ?? true);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  const updateDay = (day: typeof DAYS[number], patch: Partial<DaySchedule>) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateWorkingHoursAction({ timezone, schedule, offHoursMessage: message, showExpectedResponseTime: showETA });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
              <SelectContent>{TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="mb-2 block">Schedule</Label>
            {DAYS.map(day => {
              const ds = schedule[day];
              return (
                <div key={day} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
                  <Switch checked={ds.enabled} onCheckedChange={(v: boolean) => updateDay(day, { enabled: v })} id={`day-${day}`} />
                  <label htmlFor={`day-${day}`} className="w-28 text-sm cursor-pointer">{DAY_LABELS[day]}</label>
                  <div className={`flex items-center gap-2 ${!ds.enabled ? "opacity-40 pointer-events-none" : ""}`}>
                    <Select value={ds.start} onValueChange={(v: string) => updateDay(day, { start: v })}>
                      <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-sm">{"\u2014"}</span>
                    <Select value={ds.end} onValueChange={(v: string) => updateDay(day, { end: v })}>
                      <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="off-hours-msg">Off-hours message <span className="text-muted-foreground text-xs">{message.length}/500</span></Label>
            <Textarea id="off-hours-msg" value={message} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)} rows={3} maxLength={500} />
            <p className="text-xs text-muted-foreground">Sent automatically when a customer messages outside working hours</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-eta" checked={showETA} onCheckedChange={setShowETA} />
            <Label htmlFor="show-eta" className="cursor-pointer">Show next available time in message</Label>
          </div>
        </CardContent>
      </Card>
      <Button onClick={handleSave} className="w-full sm:w-auto">
        {saved ? "\u2713 Saved" : "Save Working Hours"}
      </Button>
    </div>
  );
}
