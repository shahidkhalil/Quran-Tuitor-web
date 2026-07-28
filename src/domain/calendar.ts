/** Month-grid helpers for schedule calendars. */

export type CalendarDay = {
  date: Date;
  isoDate: string; // YYYY-MM-DD local
  inMonth: boolean;
  isToday: boolean;
};

export function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

export function monthTitle(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Sunday-start month grid (6 weeks × 7). */
export function buildMonthGrid(month: Date, today = new Date()): CalendarDay[] {
  const first = startOfMonth(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const todayIso = toLocalIsoDate(today);
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const isoDate = toLocalIsoDate(date);
    days.push({
      date,
      isoDate,
      inMonth: date.getMonth() === first.getMonth(),
      isToday: isoDate === todayIso,
    });
  }
  return days;
}

export function lessonLocalIsoDate(slotStartIso: string): string {
  return toLocalIsoDate(new Date(slotStartIso));
}

export const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
