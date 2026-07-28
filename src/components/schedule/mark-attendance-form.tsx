"use client";

import { useActionState } from "react";
import {
  ATTENDANCE_OUTCOME_OPTIONS,
} from "@/domain/attendance";
import {
  markLessonAttendance,
  type MarkAttendanceState,
} from "@/server/actions/attendance";

const initial: MarkAttendanceState = {};

type Props = {
  lessonId: string;
};

export function MarkAttendanceForm({ lessonId }: Props) {
  const [state, action, pending] = useActionState(markLessonAttendance, initial);

  return (
    <form action={action} className="mt-4 space-y-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-4 py-3">
      <input type="hidden" name="lessonId" value={lessonId} />
      <p className="text-sm font-semibold text-[var(--color-on-surface)]">
        Mark attendance
      </p>
      <fieldset className="space-y-2">
        <legend className="sr-only">Attendance outcome</legend>
        {ATTENDANCE_OUTCOME_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-start gap-2 text-sm"
          >
            <input
              type="radio"
              name="outcome"
              value={opt.value}
              required
              className="mt-1"
              disabled={pending}
            />
            <span>
              <span className="font-medium text-[var(--color-on-surface)]">
                {opt.label}
              </span>
              <span className="block text-xs text-[var(--color-on-surface-muted)]">
                {opt.hint}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {state.fieldErrors?.outcome ? (
        <p className="text-xs text-[var(--color-error)]" role="alert">
          {state.fieldErrors.outcome}
        </p>
      ) : null}
      <label className="block text-sm">
        <span className="text-[var(--color-on-surface-muted)]">
          Note (optional)
        </span>
        <textarea
          name="note"
          rows={2}
          maxLength={500}
          disabled={pending}
          className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
          placeholder="Anything the parent should know"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-panel btn-panel-primary"
      >
        {pending ? "Saving…" : "Save attendance"}
      </button>
    </form>
  );
}
