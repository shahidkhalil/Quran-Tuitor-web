"use client";

import {
  decideApplication,
  type VettingFormState,
} from "@/server/actions/admin-vetting";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";

const initialState: VettingFormState = {};

type Props = {
  applicationId: string;
};

export function VettingDecisionForm({ applicationId }: Props) {
  const [state, formAction, pending] = useActionState(
    decideApplication,
    initialState,
  );

  return (
    <div className="mt-8 space-y-6 border-t border-[var(--color-outline)] pt-8">
      <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-medium">
        Decision
      </h2>

      <form action={formAction} className="flex max-w-xl flex-col gap-4">
        <input type="hidden" name="applicationId" value={applicationId} />

        <div className="space-y-2">
          <label
            htmlFor="reason"
            className="text-sm font-semibold text-[var(--color-on-surface)]"
          >
            Reason (required for reject or request info)
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            placeholder="Explain what’s missing or why the application isn’t approved…"
            className="w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          />
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-[var(--color-error)]">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            name="decision"
            value="approve"
            disabled={pending}
          >
            {pending ? "Saving…" : "Approve"}
          </Button>
          <Button
            type="submit"
            name="decision"
            value="needs_info"
            variant="secondary"
            disabled={pending}
          >
            Request more info
          </Button>
          <Button
            type="submit"
            name="decision"
            value="reject"
            variant="secondary"
            disabled={pending}
            className="border-[var(--color-error)]/40 text-[var(--color-error)]"
          >
            Reject
          </Button>
        </div>
      </form>
    </div>
  );
}
