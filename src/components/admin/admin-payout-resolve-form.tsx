"use client";

import { useActionState } from "react";
import {
  adminResolvePayout,
  type AdminPayoutState,
} from "@/server/actions/payouts";

const initial: AdminPayoutState = {};

export function AdminPayoutResolveForm() {
  const [state, action, pending] = useActionState(adminResolvePayout, initial);

  return (
    <form action={action} className="surface-card space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="display-title text-xl text-[var(--color-primary)]">
          Resolve payout
        </h2>
        <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
          Confirm a pending/manual payout as paid (posts ledger debit) or mark
          failed. Always audited.
        </p>
      </div>

      <label className="block text-sm">
        <span className="text-[var(--color-on-surface-muted)]">Payout id</span>
        <input
          name="payoutId"
          required
          disabled={pending}
          className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
        />
      </label>

      <fieldset className="space-y-2 text-sm">
        <legend className="text-[var(--color-on-surface-muted)]">Decision</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="decision" value="paid" required disabled={pending} />
          Mark paid
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="decision" value="failed" disabled={pending} />
          Mark failed
        </label>
      </fieldset>

      <label className="block text-sm">
        <span className="text-[var(--color-on-surface-muted)]">Audit reason</span>
        <textarea
          name="reason"
          required
          minLength={5}
          rows={3}
          disabled={pending}
          className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-[var(--color-success)]">
          Payout updated and audit logged.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-panel btn-panel-primary">
        {pending ? "Saving…" : "Resolve payout"}
      </button>
    </form>
  );
}
