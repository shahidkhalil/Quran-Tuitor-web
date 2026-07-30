"use client";

import { useActionState } from "react";
import {
  adminHideLessonReview,
  type HideReviewState,
} from "@/server/actions/reviews";

type Props = {
  reviewId: string;
};

const initial: HideReviewState = {};

export function AdminHideReviewForm({ reviewId }: Props) {
  const [state, action, pending] = useActionState(adminHideLessonReview, initial);

  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <label className="sr-only" htmlFor={`hide-reason-${reviewId}`}>
        Moderation reason
      </label>
      <input
        id={`hide-reason-${reviewId}`}
        name="reason"
        required
        disabled={pending}
        placeholder="Reason (abuse, spam, off-platform pay ask…)"
        className="min-h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 text-sm"
      />
      {state.fieldErrors?.reason || state.error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {state.fieldErrors?.reason ?? state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-panel btn-panel-secondary !min-h-9 !px-3 text-[11px]"
      >
        {pending ? "Hiding…" : "Hide from listing"}
      </button>
    </form>
  );
}
