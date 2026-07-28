export const TRIAL_TIMEOUT_HOURS = 24;
export const TRIAL_CURRENCY = "USD" as const;
/** Parent-facing trial charge is always zero (minor units). */
export const TRIAL_PARENT_AMOUNT_CENTS = 0;
/** Platform-funded tutor stipend for a completed trial ($5.00 USD default). */
export const TRIAL_STIPEND_CENTS_DEFAULT = 500;

/** Resolve stipend from env override or default policy. */
export function resolveTrialStipendCents(
  envValue: string | undefined = typeof process !== "undefined"
    ? process.env.TRIAL_STIPEND_CENTS
    : undefined,
): number {
  if (envValue === undefined || envValue === "") {
    return TRIAL_STIPEND_CENTS_DEFAULT;
  }
  const n = Number(envValue);
  if (!Number.isFinite(n) || n < 0) return TRIAL_STIPEND_CENTS_DEFAULT;
  return Math.floor(n);
}

export const TRIAL_STATUSES = [
  "pending_tutor",
  "accepted",
  "declined",
  "timed_out",
  "completed",
  "cancelled",
] as const;

export type TrialStatus = (typeof TRIAL_STATUSES)[number];

export type TrialBooking = {
  id: string;
  parent_id: string;
  learner_id: string;
  tutor_id: string;
  listing_id: string;
  slot_start: string;
  slot_end: string;
  status: TrialStatus;
  /** Always 0 for trials */
  parent_amount_cents: number;
  currency: typeof TRIAL_CURRENCY;
  meeting_url: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  summary: string | null;
  recommendation: string | null;
  completed_at: string | null;
};

export function trialStatusLabel(status: TrialStatus): string {
  switch (status) {
    case "pending_tutor":
      return "Waiting for tutor";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "timed_out":
      return "Timed out";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

export type TrialSlotOption = {
  start: string;
  end: string;
  label: string;
  dayKey: string;
  dayLabel: string;
  timeLabel: string;
};

/** Propose bookable slots for the next few days (30-min trials). */
export function proposeTrialSlots(
  from: Date = new Date(),
  days = 5,
): TrialSlotOption[] {
  const hours = [17, 18, 19, 20];
  const options: TrialSlotOption[] = [];
  const startDay = new Date(from);
  startDay.setHours(0, 0, 0, 0);

  for (let d = 1; d <= days; d++) {
    const day = new Date(startDay);
    day.setDate(day.getDate() + d);
    for (const hour of hours) {
      const start = new Date(day);
      start.setHours(hour, 0, 0, 0);
      if (start.getTime() <= from.getTime() + 2 * 60 * 60 * 1000) continue;
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      options.push({
        start: start.toISOString(),
        end: end.toISOString(),
        label: formatSlotLabel(start, end),
        dayKey: dayKey(start),
        dayLabel: formatDayLabel(start),
        timeLabel: formatTimeRange(start, end),
      });
    }
  }
  return options.slice(0, 20);
}

export function groupSlotsByDay(
  slots: TrialSlotOption[],
): { dayKey: string; dayLabel: string; slots: TrialSlotOption[] }[] {
  const map = new Map<string, { dayLabel: string; slots: TrialSlotOption[] }>();
  for (const slot of slots) {
    const existing = map.get(slot.dayKey);
    if (existing) {
      existing.slots.push(slot);
    } else {
      map.set(slot.dayKey, { dayLabel: slot.dayLabel, slots: [slot] });
    }
  }
  return [...map.entries()].map(([dayKey, value]) => ({
    dayKey,
    dayLabel: value.dayLabel,
    slots: value.slots,
  }));
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formatDayLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);

  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const monthDay = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (compare.getTime() === tomorrow.getTime()) {
    return `Tomorrow · ${monthDay}`;
  }
  return `${weekday} · ${monthDay}`;
}

function formatTimeRange(start: Date, end: Date): string {
  const startTime = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${startTime}–${endTime}`;
}

export function formatSlotLabel(start: Date, end: Date): string {
  return `${formatDayLabel(start)} · ${formatTimeRange(start, end)}`;
}

export function slotWithinAvailabilityHint(
  slotStartIso: string,
  availabilitySummary: string,
): boolean {
  void slotStartIso;
  void availabilitySummary;
  return true;
}

/** Third-party meeting room for accepted trials (AD-8 MVP placeholder). */
export function buildTrialMeetingUrl(bookingId: string): string {
  const room = `qtm-trial-${bookingId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24)}`;
  return `https://meet.jit.si/${room}`;
}

export function isTrialExpired(booking: TrialBooking, now = new Date()): boolean {
  return (
    booking.status === "pending_tutor" &&
    new Date(booking.expires_at).getTime() <= now.getTime()
  );
}

export function hasTrialSlotEnded(
  booking: Pick<TrialBooking, "slot_end">,
  now = new Date(),
): boolean {
  return new Date(booking.slot_end).getTime() <= now.getTime();
}

/** Tutor may submit summary after accept once the scheduled end has passed. */
export function canSubmitTrialSummary(
  booking: Pick<TrialBooking, "status" | "slot_end">,
  now = new Date(),
): boolean {
  return booking.status === "accepted" && hasTrialSlotEnded(booking, now);
}

/**
 * Parent Conversion CTA after summary (completed) or after scheduled end
 * even if the tutor summary is late.
 */
export function canShowConversionCta(
  booking: Pick<TrialBooking, "status" | "slot_end">,
  now = new Date(),
): boolean {
  if (booking.status === "completed") return true;
  return booking.status === "accepted" && hasTrialSlotEnded(booking, now);
}
