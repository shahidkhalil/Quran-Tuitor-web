"use client";

import { useActionState } from "react";
import {
  applyTutorEnforcement,
  type EnforcementFormState,
} from "@/server/actions/admin-enforcement";
import {
  ENFORCEMENT_ACTIONS,
  enforcementActionLabel,
  type EnforcementStatus,
} from "@/domain/tutor-enforcement";

type Props = {
  tutorId: string;
  currentStatus: EnforcementStatus;
};

const initial: EnforcementFormState = {};

export function AdminEnforcementForm({ tutorId, currentStatus }: Props) {
  const [state, action, pending] = useActionState(applyTutorEnforcement, initial);

  return (
    <form action={action} className="surface-card space-y-4 p-5 md:p-6">
      <input type="hidden" name="tutorId" value={tutorId} />
      <div>
        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
          Quality enforcement
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
          Current status: <strong>{currentStatus}</strong>. Suspend / unlist
          removes the listing from browse and blocks new bookings. Internal
          reasons stay admin-only.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="enf-action"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Action
        </label>
        <select
          id="enf-action"
          name="action"
          required
          defaultValue=""
          disabled={pending}
          className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 text-sm"
        >
          <option value="" disabled>
            Select action…
          </option>
          {ENFORCEMENT_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {enforcementActionLabel(a)}
            </option>
          ))}
        </select>
        {state.fieldErrors?.action ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.action}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="enf-reason"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Internal reason (required)
        </label>
        <textarea
          id="enf-reason"
          name="reason"
          required
          rows={3}
          disabled={pending}
          placeholder="Policy breach evidence — not shown to parents…"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 py-2.5 text-sm"
        />
        {state.fieldErrors?.reason ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.reason}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="enf-public"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Public message (optional)
        </label>
        <textarea
          id="enf-public"
          name="publicMessage"
          rows={2}
          disabled={pending}
          placeholder="Shown on booking errors for parents — keep calm and non-specific…"
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
        disabled={pending}
        className="btn-panel btn-panel-primary"
      >
        {pending ? "Saving…" : "Apply enforcement"}
      </button>
    </form>
  );
}
