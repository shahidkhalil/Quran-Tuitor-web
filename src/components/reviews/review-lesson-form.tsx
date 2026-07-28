"use client";

import { useActionState } from "react";
import {
  submitLessonReview,
  updateLessonReview,
  type SubmitLessonReviewState,
} from "@/server/actions/reviews";

const initial: SubmitLessonReviewState = {};

const fieldClass =
  "mt-1.5 w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]";

type Props = {
  lessonId: string;
  mode?: "create" | "edit";
  reviewId?: string;
  defaultRating?: number;
  defaultBody?: string;
  editHoursLeft?: number;
};

export function ReviewLessonForm({
  lessonId,
  mode = "create",
  reviewId,
  defaultRating,
  defaultBody = "",
  editHoursLeft,
}: Props) {
  const action = mode === "edit" ? updateLessonReview : submitLessonReview;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="lessonId" value={lessonId} />
      {mode === "edit" && reviewId ? (
        <input type="hidden" name="reviewId" value={reviewId} />
      ) : null}

      {mode === "edit" && editHoursLeft != null ? (
        <p className="text-xs text-[var(--color-on-surface-muted)]">
          You can edit this review for about {editHoursLeft} more hour
          {editHoursLeft === 1 ? "" : "s"}.
        </p>
      ) : null}

      <div>
        <label htmlFor={`rating-${lessonId}`} className="text-sm font-semibold">
          Rating
        </label>
        <select
          id={`rating-${lessonId}`}
          name="rating"
          defaultValue={defaultRating ? String(defaultRating) : ""}
          className={fieldClass}
        >
          <option value="" disabled>
            Select a rating
          </option>
          <option value="5">5 · Excellent</option>
          <option value="4">4 · Very good</option>
          <option value="3">3 · Good</option>
          <option value="2">2 · Needs improvement</option>
          <option value="1">1 · Poor</option>
        </select>
        {state.fieldErrors?.rating ? (
          <p className="mt-1 text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.rating}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`body-${lessonId}`} className="text-sm font-semibold">
          Review
        </label>
        <textarea
          id={`body-${lessonId}`}
          name="body"
          rows={3}
          maxLength={500}
          defaultValue={defaultBody}
          placeholder="Share what went well and what could improve."
          className={fieldClass}
        />
        {state.fieldErrors?.body ? (
          <p className="mt-1 text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.body}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-[var(--color-success)]" role="status">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-panel btn-panel-primary"
      >
        {pending
          ? mode === "edit"
            ? "Saving…"
            : "Submitting…"
          : mode === "edit"
            ? "Update review"
            : "Submit review"}
      </button>
    </form>
  );
}
