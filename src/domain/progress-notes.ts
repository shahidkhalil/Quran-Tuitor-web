/** Structured post-lesson progress notes (Story 6.2 / FR20 / UX-DR15). */

import { isCompletedPaidLesson } from "./attendance";
import type { ScheduledLesson } from "./recurring-bookings";

export const PROGRESS_FIELD_MAX = 2000;

export type ProgressNote = {
  id: string;
  lesson_id: string;
  recurring_booking_id: string;
  payment_id: string;
  parent_id: string;
  tutor_id: string;
  listing_id: string;
  learner_id: string;
  covered: string;
  improve: string;
  homework: string;
  /** Parent checklist — keys of completed homework lines (additive). */
  homework_done_keys?: string[];
  created_at: string;
  updated_at: string;
  /** Set only if Admin corrects later */
  admin_corrected_at: string | null;
  admin_corrected_by: string | null;
};

export function normalizeProgressField(
  raw: string,
  label: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.replace(/\r\n/g, "\n").trim();
  if (!value) return { ok: false, error: `${label} is required.` };
  if (value.length > PROGRESS_FIELD_MAX) {
    return {
      ok: false,
      error: `${label} must be under ${PROGRESS_FIELD_MAX} characters.`,
    };
  }
  return { ok: true, value };
}

/** Tutor may submit once after attendance marks the lesson completed. */
export function canSubmitProgressNote(
  lesson: Pick<ScheduledLesson, "status" | "progress_note_id">,
): boolean {
  return isCompletedPaidLesson(lesson) && !lesson.progress_note_id;
}
