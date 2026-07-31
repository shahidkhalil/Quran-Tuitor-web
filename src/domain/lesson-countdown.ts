/** Pick the next lesson for home countdown banners. */

export type CountdownLesson = {
  id: string;
  slot_start: string;
  slot_end: string;
  partyLabel: string;
  meeting_url: string | null;
  kind: "paid" | "trial";
};

/** Prefer the soonest lesson that has not fully ended (15m grace after end). */
export function pickNextCountdownLesson(
  items: CountdownLesson[],
  nowMs = Date.now(),
): CountdownLesson | null {
  const graceMs = 15 * 60 * 1000;
  const sorted = items
    .filter((item) => {
      const end = new Date(item.slot_end).getTime();
      return !Number.isNaN(end) && end + graceMs >= nowMs;
    })
    .sort(
      (a, b) =>
        new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime(),
    );
  return sorted[0] ?? null;
}

/** Join CTA visible from 30m before start until lesson end + grace. */
export function countdownJoinVisible(
  slotStartIso: string,
  slotEndIso: string,
  nowMs = Date.now(),
): boolean {
  const start = new Date(slotStartIso).getTime();
  const end = new Date(slotEndIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  const openAt = start - 30 * 60 * 1000;
  const closeAt = end + 15 * 60 * 1000;
  return nowMs >= openAt && nowMs <= closeAt;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) {
    return `${days}d ${hours}h ${String(mins).padStart(2, "0")}m`;
  }
  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  }
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

export function countdownPhase(
  slotStartIso: string,
  slotEndIso: string,
  nowMs = Date.now(),
): "upcoming" | "live" | "ended" {
  const start = new Date(slotStartIso).getTime();
  const end = new Date(slotEndIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return "ended";
  if (nowMs < start) return "upcoming";
  if (nowMs <= end) return "live";
  return "ended";
}
