"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  submitTrialSummary,
  type TrialSummaryFormState,
} from "@/server/actions/trials";

type Props = {
  bookingId: string;
};

const initial: TrialSummaryFormState = {};

export function TrialSummaryForm({ bookingId }: Props) {
  const [state, action, pending] = useActionState(submitTrialSummary, initial);

  return (
    <form action={action} className="mt-4 max-w-lg space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <p className="text-sm font-semibold text-[var(--color-on-surface)]">
        Post-trial summary
      </p>
      <p className="text-sm text-[var(--color-on-surface-muted)]">
        Share what you covered and a short recommendation for the parent.
      </p>

      <div className="space-y-1">
        <label
          htmlFor={`summary-${bookingId}`}
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Lesson summary
        </label>
        <textarea
          id={`summary-${bookingId}`}
          name="summary"
          required
          rows={3}
          disabled={pending}
          placeholder="What you covered, how the learner engaged…"
          className="w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        />
        {state.fieldErrors?.summary ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.summary}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`recommendation-${bookingId}`}
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Recommendation
        </label>
        <textarea
          id={`recommendation-${bookingId}`}
          name="recommendation"
          required
          rows={2}
          disabled={pending}
          placeholder="e.g. Ready for weekly Tajweed lessons…"
          className="w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        />
        {state.fieldErrors?.recommendation ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.recommendation}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit summary"}
      </Button>
    </form>
  );
}
