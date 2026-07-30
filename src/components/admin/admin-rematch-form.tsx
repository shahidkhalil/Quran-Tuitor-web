"use client";

import { useActionState } from "react";
import {
  executeFreeRematch,
  type RematchContext,
  type RematchFormState,
} from "@/server/actions/admin-rematch";

type Props = {
  caseId: string;
  context: RematchContext;
};

const initial: RematchFormState = {};

export function AdminRematchForm({ caseId, context }: Props) {
  const [state, action, pending] = useActionState(executeFreeRematch, initial);

  if (context.alreadyRematched) {
    return (
      <div className="surface-card space-y-2 p-5 md:p-6">
        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
          Free rematch
        </p>
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          Rematch already recorded
          {context.rematchId ? ` (${context.rematchId.slice(0, 8)}…)` : ""}.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="surface-card space-y-4 p-5 md:p-6">
      <input type="hidden" name="caseId" value={caseId} />
      <div>
        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
          Free rematch
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
          Move the family to another published tutor. No rematch fee. Unused
          prepaid lessons ({context.transferableLessons}) transfer when a paid
          schedule exists.
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] px-3 py-2 text-xs text-[var(--color-on-surface-muted)]">
        Fee: <span className="font-semibold text-[var(--color-primary)]">$0</span>
        {" · "}
        Credits to transfer:{" "}
        <span className="font-semibold text-[var(--color-on-surface)]">
          {context.transferableLessons}
        </span>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="to-listing"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          New verified tutor
        </label>
        {context.candidateListings.length === 0 ? (
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            No other published tutors available.
          </p>
        ) : (
          <select
            id="to-listing"
            name="toListingId"
            required
            defaultValue=""
            disabled={pending}
            className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 text-sm"
          >
            <option value="" disabled>
              Select a listing…
            </option>
            {context.candidateListings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.headline} · ${l.rate_usd}/lesson
              </option>
            ))}
          </select>
        )}
        {state.fieldErrors?.toListingId ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.toListingId}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="rematch-notes"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Notes (optional — shown in outcome)
        </label>
        <textarea
          id="rematch-notes"
          name="notes"
          rows={2}
          disabled={pending}
          placeholder="Why rematch / what family was told…"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 py-2.5 text-sm"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || context.candidateListings.length === 0}
        className="btn-panel btn-panel-primary"
      >
        {pending ? "Executing…" : "Execute free rematch"}
      </button>
    </form>
  );
}
