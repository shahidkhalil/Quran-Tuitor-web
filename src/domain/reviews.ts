export type LessonReview = {
  id: string;
  lesson_id: string;
  payment_id: string;
  listing_id: string;
  tutor_id: string;
  parent_id: string;
  learner_id: string;
  rating: number;
  body: string;
  author_display: string;
  created_at: string;
  updated_at: string;
};

export const REVIEW_MIN_RATING = 1;
export const REVIEW_MAX_RATING = 5;
export const REVIEW_MIN_BODY_LENGTH = 12;
export const REVIEW_MAX_BODY_LENGTH = 500;
/** Parents can edit a submitted review within this window. */
export const REVIEW_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isValidReviewRating(value: number): boolean {
  return (
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= REVIEW_MIN_RATING &&
    value <= REVIEW_MAX_RATING
  );
}

export function canEditReview(
  review: Pick<LessonReview, "created_at">,
  now: Date = new Date(),
): boolean {
  const created = new Date(review.created_at).getTime();
  if (Number.isNaN(created)) return false;
  return now.getTime() - created <= REVIEW_EDIT_WINDOW_MS;
}

export function reviewEditHoursLeft(
  review: Pick<LessonReview, "created_at">,
  now: Date = new Date(),
): number {
  const created = new Date(review.created_at).getTime();
  if (Number.isNaN(created)) return 0;
  const remaining = REVIEW_EDIT_WINDOW_MS - (now.getTime() - created);
  return Math.max(0, Math.ceil(remaining / (60 * 60 * 1000)));
}
