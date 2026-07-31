"use client";

import { useActionState } from "react";
import {
  createFamilyInvite,
  type FamilyInviteFormState,
} from "@/server/actions/family-shares";

const initial: FamilyInviteFormState = {};

export function FamilyInviteForm() {
  const [state, action, pending] = useActionState(createFamilyInvite, initial);

  return (
    <form action={action} className="space-y-3">
      <label
        htmlFor="invite-email"
        className="text-xs font-semibold text-[var(--color-on-surface-muted)]"
      >
        Co-parent email
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="partner@example.com"
          className="min-h-11 flex-1 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-panel btn-panel-primary shrink-0"
        >
          {pending ? "Creating…" : "Create invite"}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <div
          role="status"
          className="rounded-[var(--radius-md)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)]/40 px-3 py-3 text-sm"
        >
          <p className="font-semibold text-[var(--color-primary)]">
            {state.success}
          </p>
          {state.inviteLink ? (
            <p className="mt-2 break-all text-xs text-[var(--color-on-surface-muted)]">
              {state.inviteLink}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
