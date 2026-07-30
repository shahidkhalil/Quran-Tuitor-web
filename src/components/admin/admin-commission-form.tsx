"use client";

import { useActionState } from "react";
import {
  updateCommissionConfig,
  type CommissionFormState,
} from "@/server/actions/admin-ops";
import { formatCommissionPercent } from "@/domain/ledger";

type Props = {
  currentBps: number;
};

const initial: CommissionFormState = {};

export function AdminCommissionForm({ currentBps }: Props) {
  const [state, action, pending] = useActionState(updateCommissionConfig, initial);

  return (
    <form action={action} className="surface-card space-y-4 p-5 md:p-6">
      <div>
        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
          Platform commission
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
          Current: {formatCommissionPercent(currentBps)} ({currentBps} bps).
          Changes are audited and apply to new paid-lesson earnings.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="commission-bps"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Commission (basis points)
        </label>
        <input
          id="commission-bps"
          name="commissionBps"
          type="number"
          min={0}
          max={10000}
          step={1}
          required
          defaultValue={currentBps}
          disabled={pending}
          className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 text-sm"
        />
        <p className="text-xs text-[var(--color-on-surface-muted)]">
          Example: 2500 = 25%, 2000 = 20%, 0 = no take.
        </p>
        {state.fieldErrors?.bps ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.bps}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="commission-reason"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Reason (audit)
        </label>
        <textarea
          id="commission-reason"
          name="reason"
          required
          rows={2}
          disabled={pending}
          placeholder="Why this rate change…"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 py-2.5 text-sm"
        />
        {state.fieldErrors?.reason ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.reason}
          </p>
        ) : null}
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
        {pending ? "Saving…" : "Save commission"}
      </button>
    </form>
  );
}
