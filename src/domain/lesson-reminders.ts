/** Lesson reminder windows (24h / 15m) — pure helpers for cron. */

export const REMINDER_KINDS = ["24h", "15m"] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

const HOUR_MS = 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

/**
 * Send ~24h reminder when start is between 23h and 25h away
 * (wide enough for a 10–15 min cron without duplicates via sent_at).
 */
export function shouldSend24hReminder(
  slotStartIso: string,
  now = new Date(),
  alreadySent = false,
): boolean {
  if (alreadySent) return false;
  const start = new Date(slotStartIso).getTime();
  if (Number.isNaN(start)) return false;
  const ms = start - now.getTime();
  return ms > 23 * HOUR_MS && ms <= 25 * HOUR_MS;
}

/**
 * Send ~15m reminder when start is between 1m and 20m away.
 */
export function shouldSend15mReminder(
  slotStartIso: string,
  now = new Date(),
  alreadySent = false,
): boolean {
  if (alreadySent) return false;
  const start = new Date(slotStartIso).getTime();
  if (Number.isNaN(start)) return false;
  const ms = start - now.getTime();
  return ms > 1 * MIN_MS && ms <= 20 * MIN_MS;
}

export function reminderCopy(
  kind: ReminderKind,
  whenLabel: string,
): { title: string; body: string } {
  if (kind === "24h") {
    return {
      title: "Lesson tomorrow",
      body: `Reminder: you have a lesson starting ${whenLabel}. Run a quick device check, then join from Schedule or Calendar.`,
    };
  }
  return {
    title: "Lesson starting soon",
    body: `Your lesson starts ${whenLabel}. Open Join lesson (device check → meeting link).`,
  };
}
