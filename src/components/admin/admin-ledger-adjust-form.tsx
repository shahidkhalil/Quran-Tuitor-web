"use client";

import { useActionState } from "react";
import {
  adminAdjustLedgerEntry,
  type AdminLedgerAdjustState,
} from "@/server/actions/ledger";

const initial: AdminLedgerAdjustState = {};

export function AdminLedgerAdjustForm() {
  const [state, action, pending] = useActionState(
    adminAdjustLedgerEntry,
    initial,
  );

  return (
    <form action={action} className="surface-card space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="display-title text-xl text-[var(--color-primary)]">
          Ledger adjustment
        </h2>
        <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
          Posts a new immutable line (never edits prior credits). Amount in USD
          cents — use a negative value to debit.
        </p>
      </div>

      <label className="block text-sm">
        <span className="text-[var(--color-on-surface-muted)]">Tutor user id</span>
        <input
          name="tutorId"
          required
          disabled={pending}
          className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
          placeholder="Firebase uid"
        />
      </label>

      <label className="block text-sm">
        <span className="text-[var(--color-on-surface-muted)]">
          Amount (cents)
        </span>
        <input
          name="amountCents"
          type="number"
          required
          disabled={pending}
          className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
          placeholder="e.g. 500 or -500"
        />
      </label>

      <label className="block text-sm">
        <span className="text-[var(--color-on-surface-muted)]">
          Related entry id (optional)
        </span>
        <input
          name="relatedEntryId"
          disabled={pending}
          className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
          placeholder="paid_lesson_… or trial_stipend_…"
        />
      </label>

      <label className="block text-sm">
        <span className="text-[var(--color-on-surface-muted)]">Audit reason</span>
        <textarea
          name="reason"
          required
          rows={3}
          minLength={5}
          disabled={pending}
          className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
          placeholder="Why this adjustment is needed"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-[var(--color-success)]">
          Adjustment posted and audit logged.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-panel btn-panel-primary"
      >
        {pending ? "Saving…" : "Post adjustment"}
      </button>
    </form>
  );
}
