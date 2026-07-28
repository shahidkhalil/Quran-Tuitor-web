"use client";

import { Button } from "@/components/ui/button";
import {
  COMMON_LESSON_TIMES,
  LESSON_DURATION_MINUTES,
  WEEKDAY_OPTIONS,
  formatLessonSlot,
  generateWeeklyOccurrences,
  nextWeeklyStartLocal,
  type Weekday,
} from "@/domain/recurring-bookings";
import {
  createRecurringBooking,
  type ScheduleFormState,
} from "@/server/actions/recurring-bookings";
import { useMemo, useState, useActionState, useEffect } from "react";

type Props = {
  paymentId: string;
  lessonCount: number;
  listingHeadline: string;
  learnerName: string | null;
};

const initial: ScheduleFormState = {};

export function CreateRecurringScheduleForm({
  paymentId,
  lessonCount,
  listingHeadline,
  learnerName,
}: Props) {
  const [state, action, pending] = useActionState(
    createRecurringBooking,
    initial,
  );
  const [weekday, setWeekday] = useState<Weekday>(1);
  const [localTime, setLocalTime] = useState<string>("18:00");
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    } catch {
      setTimezone("UTC");
    }
  }, []);

  const preview = useMemo(() => {
    const [h, m] = localTime.split(":").map(Number);
    const first = nextWeeklyStartLocal(weekday, h ?? 18, m ?? 0);
    const firstStart = first.toISOString();
    const occurrences = generateWeeklyOccurrences(
      firstStart,
      lessonCount,
      LESSON_DURATION_MINUTES,
    );
    return { firstStart, occurrences };
  }, [weekday, localTime, lessonCount]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="firstStart" value={preview.firstStart} />
      <input type="hidden" name="timezone" value={timezone} />

      <p className="text-sm text-[var(--color-on-surface-muted)]">
        Weekly lessons with{" "}
        <span className="font-semibold text-[var(--color-on-surface)]">
          {listingHeadline}
        </span>
        {learnerName ? (
          <>
            {" "}
            for{" "}
            <span className="font-semibold text-[var(--color-on-surface)]">
              {learnerName}
            </span>
          </>
        ) : null}
        . Each lesson is {LESSON_DURATION_MINUTES} minutes · {lessonCount}{" "}
        sessions from your package.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="weekday"
            className="text-sm font-semibold text-[var(--color-on-surface)]"
          >
            Weekday
          </label>
          <select
            id="weekday"
            name="weekday"
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value) as Weekday)}
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm"
          >
            {WEEKDAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.weekday ? (
            <p className="mt-1 text-sm text-[var(--color-error)]">
              {state.fieldErrors.weekday}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="localTime"
            className="text-sm font-semibold text-[var(--color-on-surface)]"
          >
            Time ({timezone})
          </label>
          <select
            id="localTime"
            name="localTime"
            value={localTime}
            onChange={(e) => setLocalTime(e.target.value)}
            className="mt-1.5 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm"
          >
            {COMMON_LESSON_TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {state.fieldErrors?.localTime ? (
            <p className="mt-1 text-sm text-[var(--color-error)]">
              {state.fieldErrors.localTime}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <p className="eyebrow text-[var(--color-accent)]">Preview</p>
        {preview.occurrences.length === 0 ? (
          <div className="mt-3 space-y-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]"
              />
            ))}
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {preview.occurrences.map((occ) => (
              <li
                key={occ.sequence}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-[var(--color-on-surface)]">
                  Lesson {occ.sequence}
                </span>
                <span className="text-[var(--color-on-surface-muted)]">
                  {formatLessonSlot(occ.slot_start, occ.slot_end)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_8%,white)] px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Locking schedule…" : "Confirm weekly schedule"}
      </Button>
    </form>
  );
}
