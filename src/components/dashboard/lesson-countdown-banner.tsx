"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  countdownJoinVisible,
  countdownPhase,
  formatCountdown,
  type CountdownLesson,
} from "@/domain/lesson-countdown";
import { formatLessonSlot } from "@/domain/recurring-bookings";
import { joinViaSystemCheck } from "@/domain/system-check";

type Props = {
  lesson: CountdownLesson;
  role: "parent" | "tutor";
  scheduleHref: string;
};

export function LessonCountdownBanner({
  lesson,
  role,
  scheduleHref,
}: Props) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const start = new Date(lesson.slot_start).getTime();
  const phase = countdownPhase(lesson.slot_start, lesson.slot_end, nowMs);
  const msUntilStart = start - nowMs;
  const showJoin =
    Boolean(lesson.meeting_url) &&
    countdownJoinVisible(lesson.slot_start, lesson.slot_end, nowMs);

  const headline =
    phase === "live"
      ? "Lesson in progress"
      : phase === "ended"
        ? "Lesson just ended"
        : "Lesson starting soon";

  const countdownText =
    phase === "upcoming"
      ? `Starts in ${formatCountdown(msUntilStart)}`
      : phase === "live"
        ? "Join now if you haven’t already"
        : "Open schedule for notes or next session";

  const joinHref =
    showJoin && lesson.meeting_url
      ? joinViaSystemCheck(lesson.meeting_url, role)
      : null;

  return (
    <div
      className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-primary)]/25 bg-[var(--color-primary)] px-5 py-4 text-white shadow-[var(--shadow-sm)]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.08em] text-white/75">
            {lesson.kind === "trial" ? "FREE TRIAL" : "PAID LESSON"} · LIVE
            COUNTDOWN
          </p>
          <p className="display-title mt-1 text-2xl text-white">{headline}</p>
          <p className="mt-1 text-sm font-semibold text-white/95">
            {countdownText}
          </p>
          <p className="mt-1 truncate text-sm text-white/75">
            {lesson.partyLabel} ·{" "}
            {formatLessonSlot(lesson.slot_start, lesson.slot_end)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {joinHref ? (
            <Link
              href={joinHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-5 text-sm font-semibold text-[var(--color-on-accent)] transition hover:opacity-95"
            >
              Join lesson
            </Link>
          ) : null}
          <Link
            href={scheduleHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/35 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {role === "tutor" ? "Calendar" : "Schedule"}
          </Link>
        </div>
      </div>
    </div>
  );
}
