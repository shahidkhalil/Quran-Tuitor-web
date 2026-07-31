/** Helpers for pre-lesson device checks (additive — does not change meeting URLs). */

export function safeExternalJoinUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Route Join through system check; falls back to direct URL if invalid. */
export function joinViaSystemCheck(
  meetingUrl: string,
  role: "parent" | "tutor",
): string {
  const safe = safeExternalJoinUrl(meetingUrl);
  if (!safe) return meetingUrl;
  const base = role === "tutor" ? "/tutor/system-check" : "/parent/system-check";
  const q = new URLSearchParams({ join: safe });
  return `${base}?${q.toString()}`;
}
