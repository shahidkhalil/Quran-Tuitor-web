"use client";

import { useActionState } from "react";
import {
  submitProgressNote,
  type ProgressNoteFormState,
} from "@/server/actions/progress-notes";
import { PROGRESS_FIELD_MAX } from "@/domain/progress-notes";

type Props = {
  lessonId: string;
};

const initial: ProgressNoteFormState = {};

export function ProgressNoteForm({ lessonId }: Props) {
  const [state, action, pending] = useActionState(submitProgressNote, initial);

  return (
    <form
      action={action}
      className="mt-4 space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-[var(--color-surface-muted)]/40 p-4"
    >
      <input type="hidden" name="lessonId" value={lessonId} />
      <div>
        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
          Progress note
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
          Parent-visible · locked after submit
        </p>
      </div>

      <Field
        id={`covered-${lessonId}`}
        name="covered"
        label="Covered"
        placeholder="What you worked on in this lesson…"
        pending={pending}
        error={state.fieldErrors?.covered}
      />
      <Field
        id={`improve-${lessonId}`}
        name="improve"
        label="Improve"
        placeholder="Areas to focus on next…"
        pending={pending}
        error={state.fieldErrors?.improve}
      />
      <Field
        id={`homework-${lessonId}`}
        name="homework"
        label="Homework"
        placeholder="Practice / revision for home…"
        pending={pending}
        error={state.fieldErrors?.homework}
      />

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
        {pending ? "Submitting…" : "Submit progress note"}
      </button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
  pending,
  error,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  pending: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-[var(--color-on-surface)]"
      >
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        required
        rows={2}
        maxLength={PROGRESS_FIELD_MAX}
        disabled={pending}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      />
      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
