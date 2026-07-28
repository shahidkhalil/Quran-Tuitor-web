"use client";

import {
  respondToNeedsInfo,
  type NeedsInfoFormState,
} from "@/server/actions/tutor-applications";
import { useActionState } from "react";

const initialState: NeedsInfoFormState = {};

export function NeedsInfoResponseForm() {
  const [state, formAction, pending] = useActionState(
    respondToNeedsInfo,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <p className="eyebrow text-[var(--color-accent)]">Action needed</p>
        <h2 className="display-title mt-1 text-2xl text-[var(--color-primary)]">
          Respond to request
        </h2>
        <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
          Add the details requested. Your application returns to pending review.
        </p>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="response"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Your response
        </label>
        <textarea
          id="response"
          name="response"
          required
          rows={4}
          className="w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          placeholder="Explain or provide the information requested…"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="extraFile" className="text-sm font-semibold">
          Extra document (optional)
        </label>
        <input
          id="extraFile"
          name="extraFile"
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          className="block w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-outline-strong)]/40 bg-[var(--color-surface-muted)]/40 px-3 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-panel btn-panel-primary"
      >
        {pending ? "Sending…" : "Send response"}
      </button>
    </form>
  );
}
