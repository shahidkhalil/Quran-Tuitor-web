"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrustStrip } from "@/components/listings/trust-strip";
import { LearnerForm } from "@/components/learners/learner-form";
import { TrialSlotPicker } from "@/components/trials/trial-slot-picker";
import type { LearnerProfile } from "@/domain/learners";
import type { TrialSlotOption } from "@/domain/trials";
import {
  bookTrialLesson,
  type TrialFormState,
} from "@/server/actions/trials";

type Props = {
  listingId: string;
  listingHeadline: string;
  availabilitySummary: string;
  learners: LearnerProfile[];
  slots: TrialSlotOption[];
};

const initial: TrialFormState = {};

export function BookTrialForm({
  listingId,
  listingHeadline,
  availabilitySummary,
  learners,
  slots,
}: Props) {
  const [state, action, pending] = useActionState(bookTrialLesson, initial);
  const trialPath = `/browse/${listingId}/trial`;

  if (learners.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-4 py-4">
          <p className="font-medium text-[var(--color-on-surface)]">
            Add a learner to continue
          </p>
          <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
            Trials are booked for a child (or yourself as an adult learner). Add
            one below, then you’ll return here to pick a slot with{" "}
            <span className="font-medium text-[var(--color-on-surface)]">
              {listingHeadline}
            </span>
            .
          </p>
        </div>
        <LearnerForm
          returnTo={trialPath}
          submitLabel="Save learner & continue"
        />
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          Or manage learners later in{" "}
          <Link
            href="/parent/learners"
            className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            Parent → Learners
          </Link>
          .
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-[var(--color-on-surface-muted)]">
        No upcoming slots are open right now. Try again later or pick another
        tutor.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="listingId" value={listingId} />

      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] px-3 py-2 text-sm">
          <span className="font-semibold text-[var(--color-success)]">$0</span>
          <span className="text-[var(--color-on-surface-muted)]">
            Free trial · No card required
          </span>
        </p>
        <TrustStrip className="text-xs text-[var(--color-on-surface-muted)]" />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-error)]"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="learnerId"
          className="block font-[family-name:var(--font-fraunces)] text-xl font-medium text-[var(--color-primary)]"
        >
          Learner
        </label>
        <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
          Who is this trial for?
        </p>
        <select
          id="learnerId"
          name="learnerId"
          required
          defaultValue={learners.length === 1 ? learners[0].id : ""}
          className="mt-3 w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 text-sm"
        >
          <option value="">Select learner…</option>
          {learners.map((learner) => (
            <option key={learner.id} value={learner.id}>
              {learner.display_name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.learnerId ? (
          <p className="mt-1 text-sm text-[var(--color-error)]">
            {state.fieldErrors.learnerId}
          </p>
        ) : null}
      </div>

      <TrialSlotPicker
        slots={slots}
        availabilitySummary={availabilitySummary}
        error={state.fieldErrors?.slotStart}
      />

      <div className="space-y-3 border-t border-[var(--color-outline)] pt-6">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Booking…" : "Request free trial"}
        </Button>
        <p className="text-xs text-[var(--color-on-surface-muted)]">
          The tutor has 24 hours to accept. You’ll see a waiting status on
          Bookings — no payment details are collected for trials.
        </p>
      </div>
    </form>
  );
}
