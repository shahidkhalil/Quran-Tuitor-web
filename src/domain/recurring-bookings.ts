/** Recurring paid bookings — weekly schedule after platform payment (Story 5.2). */

export const LESSON_DURATION_MINUTES = 45;

export const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export type Weekday = (typeof WEEKDAY_OPTIONS)[number]["value"];

export const RECURRING_FREQUENCIES = ["weekly"] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export const RECURRING_BOOKING_STATUSES = ["active", "cancelled"] as const;
export type RecurringBookingStatus =
  (typeof RECURRING_BOOKING_STATUSES)[number];

export const SCHEDULED_LESSON_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
  "tutor_no_show",
  "student_no_show",
] as const;
export type ScheduledLessonStatus = (typeof SCHEDULED_LESSON_STATUSES)[number];

export type RecurringBooking = {
  id: string;
  payment_id: string;
  parent_id: string;
  tutor_id: string;
  listing_id: string;
  learner_id: string;
  frequency: RecurringFrequency;
  /** JS getDay(): 0 = Sunday … 6 = Saturday (of first_start local intent) */
  weekday: Weekday;
  /** HH:mm in the timezone used when scheduling */
  local_time: string;
  timezone: string;
  first_start: string;
  lesson_count: number;
  duration_minutes: number;
  status: RecurringBookingStatus;
  created_at: string;
  updated_at: string;
};

export type ScheduledLesson = {
  id: string;
  recurring_booking_id: string;
  payment_id: string;
  parent_id: string;
  tutor_id: string;
  listing_id: string;
  learner_id: string;
  sequence: number;
  slot_start: string;
  slot_end: string;
  status: ScheduledLessonStatus;
  /** Story 5.3 */
  meeting_url: string | null;
  /** Story 5.4 */
  attendance_record_id?: string | null;
  attendance_marked_at?: string | null;
  /** Story 6.2 */
  progress_note_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type LessonOccurrence = {
  sequence: number;
  slot_start: string;
  slot_end: string;
};

export type TimeRange = {
  start: string;
  end: string;
};

/** True if [aStart,aEnd) overlaps [bStart,bEnd). */
export function rangesOverlap(
  aStart: string | Date,
  aEnd: string | Date,
  bStart: string | Date,
  bEnd: string | Date,
): boolean {
  const aS = new Date(aStart).getTime();
  const aE = new Date(aEnd).getTime();
  const bS = new Date(bStart).getTime();
  const bE = new Date(bEnd).getTime();
  if (
    Number.isNaN(aS) ||
    Number.isNaN(aE) ||
    Number.isNaN(bS) ||
    Number.isNaN(bE)
  ) {
    return false;
  }
  return aS < bE && bS < aE;
}

export function anyRangeConflicts(
  candidate: TimeRange,
  existing: TimeRange[],
): boolean {
  return existing.some((e) =>
    rangesOverlap(candidate.start, candidate.end, e.start, e.end),
  );
}

/**
 * Build weekly occurrences from a first start ISO.
 * Server and client must use the same firstStart + count + duration.
 */
export function generateWeeklyOccurrences(
  firstStartIso: string,
  lessonCount: number,
  durationMinutes: number = LESSON_DURATION_MINUTES,
): LessonOccurrence[] {
  const first = new Date(firstStartIso);
  if (Number.isNaN(first.getTime()) || lessonCount < 1) return [];

  const out: LessonOccurrence[] = [];
  for (let i = 0; i < lessonCount; i++) {
    const start = new Date(first);
    start.setUTCDate(start.getUTCDate() + i * 7);
    const end = new Date(start);
    end.setUTCMinutes(end.getUTCMinutes() + durationMinutes);
    out.push({
      sequence: i + 1,
      slot_start: start.toISOString(),
      slot_end: end.toISOString(),
    });
  }
  return out;
}

/** Next date (local) matching weekday at hour:minute, strictly after `from`. */
export function nextWeeklyStartLocal(
  weekday: Weekday,
  hour: number,
  minute: number,
  from: Date = new Date(),
): Date {
  const candidate = new Date(from);
  candidate.setSeconds(0, 0);
  candidate.setHours(hour, minute, 0, 0);

  for (let i = 0; i < 14; i++) {
    const d = new Date(candidate);
    d.setDate(candidate.getDate() + i);
    if (d.getDay() !== weekday) continue;
    if (d.getTime() <= from.getTime() + 60 * 60 * 1000) continue;
    return d;
  }

  // Fallback: +7 days from candidate weekday
  const fallback = new Date(from);
  fallback.setHours(hour, minute, 0, 0);
  const delta = (weekday - fallback.getDay() + 7) % 7 || 7;
  fallback.setDate(fallback.getDate() + delta);
  return fallback;
}

export function parseLocalTime(value: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function weekdayLabel(weekday: Weekday): string {
  return WEEKDAY_OPTIONS.find((w) => w.value === weekday)?.label ?? "Day";
}

/** Third-party meeting room for paid lessons (AD-8 MVP — same pattern as trials). */
export function buildLessonMeetingUrl(lessonId: string): string {
  const room = `qtm-lesson-${lessonId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}`;
  return `https://meet.jit.si/${room}`;
}

export function formatLessonSlot(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Invalid time";
  }
  const day = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} · ${startTime}–${endTime}`;
}

export const COMMON_LESSON_TIMES = [
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
] as const;
