"use client";

import {
  createLearner,
  updateLearner,
  type LearnerFormState,
} from "@/server/actions/learners";
import { AGE_BANDS, type LearnerProfile } from "@/domain/learners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";

const initialState: LearnerFormState = {};

type Props = {
  learner?: LearnerProfile;
  /** After create, redirect here (must be a same-origin path). */
  returnTo?: string;
  submitLabel?: string;
};

export function LearnerForm({ learner, returnTo, submitLabel }: Props) {
  const action = learner ? updateLearner : createLearner;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-lg flex-col gap-5">
      {learner ? <input type="hidden" name="id" value={learner.id} /> : null}
      {!learner && returnTo ? (
        <input type="hidden" name="returnTo" value={returnTo} />
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="displayName"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Name
        </label>
        <Input
          id="displayName"
          name="displayName"
          required
          defaultValue={learner?.display_name ?? ""}
          placeholder="e.g. Adam"
        />
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3">
        <input
          type="checkbox"
          name="isAdultSelf"
          defaultChecked={learner?.is_adult_self ?? false}
          className="size-4 accent-[var(--color-primary)]"
        />
        <span className="text-base">This is me (adult learner)</span>
      </label>

      <div className="space-y-2">
        <label
          htmlFor="ageBand"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Age band
        </label>
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          We store an age range only — not a full date of birth.
        </p>
        <select
          id="ageBand"
          name="ageBand"
          defaultValue={learner?.age_band ?? ""}
          className="min-h-11 w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 text-base text-[var(--color-on-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        >
          <option value="">Select age band</option>
          {AGE_BANDS.map((band) => (
            <option key={band.value} value={band.value}>
              {band.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="levelGoals"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Level / goals (optional)
        </label>
        <textarea
          id="levelGoals"
          name="levelGoals"
          rows={3}
          defaultValue={learner?.level_goals ?? ""}
          placeholder="e.g. Finished alphabet, ready for Qaida with Tajweed"
          className="w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2 text-base text-[var(--color-on-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="genderPreferenceNotes"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Tutor preference notes (optional)
        </label>
        <Input
          id="genderPreferenceNotes"
          name="genderPreferenceNotes"
          defaultValue={learner?.gender_preference_notes ?? ""}
          placeholder="e.g. Prefer a male tutor"
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_8%,white)] px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending
          ? "Saving…"
          : submitLabel
            ? submitLabel
            : learner
              ? "Save changes"
              : "Add learner"}
      </Button>
    </form>
  );
}
