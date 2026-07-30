"use client";

import { useActionState } from "react";
import {
  updateSupportCase,
  type UpdateSupportCaseState,
} from "@/server/actions/admin-support-cases";
import {
  SUPPORT_CASE_STATUSES,
  supportCaseStatusLabel,
  type SupportCaseStatus,
} from "@/domain/support-cases";

type Props = {
  caseId: string;
  status: SupportCaseStatus;
  adminInternalNotes: string | null;
  outcomeNote: string | null;
};

const initial: UpdateSupportCaseState = {};

export function AdminCaseUpdateForm({
  caseId,
  status,
  adminInternalNotes,
  outcomeNote,
}: Props) {
  const [state, action, pending] = useActionState(updateSupportCase, initial);

  return (
    <form action={action} className="surface-card space-y-4 p-5 md:p-6">
      <input type="hidden" name="caseId" value={caseId} />
      <div>
        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
          Update case
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
          Status changes notify the reporter. Internal notes stay admin-only.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="case-status"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Status
        </label>
        <select
          id="case-status"
          name="status"
          required
          defaultValue={status}
          disabled={pending}
          className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 text-sm"
        >
          {SUPPORT_CASE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {supportCaseStatusLabel(s)}
            </option>
          ))}
        </select>
        {state.fieldErrors?.status ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.status}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="outcome-note"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Outcome note (visible to reporter)
        </label>
        <textarea
          id="outcome-note"
          name="outcomeNote"
          rows={3}
          defaultValue={outcomeNote ?? ""}
          disabled={pending}
          placeholder="What you told the family or tutor…"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 py-2.5 text-sm"
        />
        {state.fieldErrors?.outcomeNote ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.outcomeNote}
          </p>
        ) : (
          <p className="text-xs text-[var(--color-on-surface-muted)]">
            Required when resolving or closing.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="internal-notes"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Internal notes (admin only)
        </label>
        <textarea
          id="internal-notes"
          name="adminInternalNotes"
          rows={3}
          defaultValue={adminInternalNotes ?? ""}
          disabled={pending}
          placeholder="Ops notes, rematch candidates, strike context…"
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
        {pending ? "Saving…" : "Save case update"}
      </button>
    </form>
  );
}
