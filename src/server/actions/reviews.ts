"use server";

import { revalidatePath } from "next/cache";
import type { PlatformPayment } from "@/domain/payments";
import type { ScheduledLesson } from "@/domain/recurring-bookings";
import {
  REVIEW_MAX_BODY_LENGTH,
  REVIEW_MAX_RATING,
  REVIEW_MIN_BODY_LENGTH,
  canEditReview,
  isValidReviewRating,
  reviewEditHoursLeft,
  type LessonReview,
} from "@/domain/reviews";
import type { ListingReview, TutorListing } from "@/domain/tutor-listings";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";

export type SubmitLessonReviewState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    rating?: string;
    body?: string;
  };
};

export type ParentReviewLessonItem = {
  lessonId: string;
  listingId: string;
  listingHeadline: string;
  learnerLabel: string;
  slotStart: string;
  slotEnd: string;
  sequence: number;
  status: "pending" | "editable" | "locked";
  reviewId?: string;
  rating?: number;
  body?: string;
  editHoursLeft?: number;
};

/** @deprecated Use ParentReviewLessonItem */
export type ParentReviewableLesson = ParentReviewLessonItem;

export type TutorReviewSummary = {
  ratingAvg: number | null;
  reviewCount: number;
  recent: ListingReview[];
};

async function requireParentLike() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Please sign in." };
  }
  if (profile.role !== "parent" && profile.role !== "adult") {
    return { ok: false as const, error: "Parent account required." };
  }
  return { ok: true as const, profile };
}

async function requireVerifiedTutor() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Please sign in." };
  }
  if (profile.role !== "tutor") {
    return { ok: false as const, error: "Tutor account required." };
  }
  return { ok: true as const, profile };
}

async function refreshListingReviews(listingId: string) {
  const reviewSnap = await db()
    .collection(COLLECTIONS.lessonReviews)
    .where("listing_id", "==", listingId)
    .get();

  const reviews = reviewSnap.docs
    .map((d) => d.data() as LessonReview)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const reviewCount = reviews.length;
  const ratingAvg =
    reviewCount > 0
      ? Number(
          (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          ).toFixed(2),
        )
      : null;

  const listingReviews: ListingReview[] = reviews.slice(0, 8).map((r) => ({
    id: r.id,
    author_display: r.author_display,
    rating: r.rating,
    body: r.body,
    created_at: r.created_at,
  }));

  await db()
    .collection(COLLECTIONS.tutorListings)
    .doc(listingId)
    .set(
      {
        rating_avg: ratingAvg,
        review_count: reviewCount,
        reviews: listingReviews,
        updated_at: nowIso(),
      } satisfies Partial<TutorListing>,
      { merge: true },
    );
}

function parseReviewFields(formData: FormData): {
  rating: number;
  body: string;
  fieldErrors: SubmitLessonReviewState["fieldErrors"];
} {
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const rating = Number(ratingRaw);
  const fieldErrors: SubmitLessonReviewState["fieldErrors"] = {};
  if (!isValidReviewRating(rating)) {
    fieldErrors.rating = `Choose a rating between 1 and ${REVIEW_MAX_RATING}.`;
  }
  if (
    body.length < REVIEW_MIN_BODY_LENGTH ||
    body.length > REVIEW_MAX_BODY_LENGTH
  ) {
    fieldErrors.body = `Write ${REVIEW_MIN_BODY_LENGTH}-${REVIEW_MAX_BODY_LENGTH} characters.`;
  }
  return { rating, body, fieldErrors };
}

export async function submitLessonReview(
  _prev: SubmitLessonReviewState,
  formData: FormData,
): Promise<SubmitLessonReviewState> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { error: ctx.error };

  const lessonId = String(formData.get("lessonId") ?? "").trim();
  if (!lessonId) return { error: "Missing lesson." };

  const { rating, body, fieldErrors } = parseReviewFields(formData);
  if (fieldErrors?.rating || fieldErrors?.body) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const lessonSnap = await db()
    .collection(COLLECTIONS.scheduledLessons)
    .doc(lessonId)
    .get();
  if (!lessonSnap.exists) return { error: "Lesson not found." };

  const lesson = lessonSnap.data() as ScheduledLesson;
  if (lesson.parent_id !== ctx.profile.id) {
    return { error: "You can only review lessons from your account." };
  }
  if (lesson.status !== "completed") {
    return { error: "Reviews are allowed only for completed lessons." };
  }

  const paymentSnap = await db()
    .collection(COLLECTIONS.payments)
    .doc(lesson.payment_id)
    .get();
  if (!paymentSnap.exists) {
    return { error: "Payment record missing for this lesson." };
  }
  const payment = paymentSnap.data() as PlatformPayment;
  if (payment.status !== "paid") {
    return { error: "You can review only paid lessons." };
  }

  const existingSnap = await db()
    .collection(COLLECTIONS.lessonReviews)
    .where("lesson_id", "==", lesson.id)
    .limit(1)
    .get();
  if (!existingSnap.empty) {
    return { error: "You have already reviewed this lesson." };
  }

  const learnerSnap = await db()
    .collection(COLLECTIONS.learnerProfiles)
    .doc(lesson.learner_id)
    .get();
  const learnerName =
    (learnerSnap.data()?.display_name as string | undefined)?.trim() ||
    "Learner";

  const stamp = nowIso();
  const id = docId();
  const review: LessonReview = {
    id,
    lesson_id: lesson.id,
    payment_id: lesson.payment_id,
    listing_id: lesson.listing_id,
    tutor_id: lesson.tutor_id,
    parent_id: lesson.parent_id,
    learner_id: lesson.learner_id,
    rating,
    body,
    author_display: `${learnerName}'s parent`,
    created_at: stamp,
    updated_at: stamp,
  };

  await db().collection(COLLECTIONS.lessonReviews).doc(id).set(review);
  await refreshListingReviews(lesson.listing_id);

  revalidatePath("/browse");
  revalidatePath(`/browse/${lesson.listing_id}`);
  revalidatePath("/parent/schedule");
  revalidatePath("/parent/bookings");
  revalidatePath("/tutor");
  revalidatePath("/tutor/account");

  return { success: "Thanks! Your review is now visible on the tutor profile." };
}

export async function updateLessonReview(
  _prev: SubmitLessonReviewState,
  formData: FormData,
): Promise<SubmitLessonReviewState> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { error: ctx.error };

  const reviewId = String(formData.get("reviewId") ?? "").trim();
  if (!reviewId) return { error: "Missing review." };

  const { rating, body, fieldErrors } = parseReviewFields(formData);
  if (fieldErrors?.rating || fieldErrors?.body) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const reviewRef = db().collection(COLLECTIONS.lessonReviews).doc(reviewId);
  const snap = await reviewRef.get();
  if (!snap.exists) return { error: "Review not found." };

  const review = snap.data() as LessonReview;
  if (review.parent_id !== ctx.profile.id) {
    return { error: "You can only edit your own reviews." };
  }
  if (!canEditReview(review)) {
    return {
      error: "The 24-hour edit window for this review has ended.",
    };
  }

  const stamp = nowIso();
  await reviewRef.set(
    {
      rating,
      body,
      updated_at: stamp,
    },
    { merge: true },
  );
  await refreshListingReviews(review.listing_id);

  revalidatePath("/browse");
  revalidatePath(`/browse/${review.listing_id}`);
  revalidatePath("/parent/schedule");
  revalidatePath("/tutor");
  revalidatePath("/tutor/account");

  return { success: "Review updated." };
}

async function enrichLessonLabels(lessons: ScheduledLesson[]) {
  const listingIds = [...new Set(lessons.map((l) => l.listing_id))];
  const learnerIds = [...new Set(lessons.map((l) => l.learner_id))];

  const [listingRows, learnerRows] = await Promise.all([
    Promise.all(
      listingIds.map(async (id) => {
        const snap = await db()
          .collection(COLLECTIONS.tutorListings)
          .doc(id)
          .get();
        return [
          id,
          (snap.data()?.headline as string | undefined) ?? "Verified tutor",
        ] as const;
      }),
    ),
    Promise.all(
      learnerIds.map(async (id) => {
        const snap = await db()
          .collection(COLLECTIONS.learnerProfiles)
          .doc(id)
          .get();
        return [
          id,
          (snap.data()?.display_name as string | undefined) ?? "Learner",
        ] as const;
      }),
    ),
  ]);

  return {
    listingMap: new Map(listingRows),
    learnerMap: new Map(learnerRows),
  };
}

export async function listMyLessonReviewBoard(): Promise<{
  items: ParentReviewLessonItem[];
  reviewedLessonIds: string[];
  error?: string;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { items: [], reviewedLessonIds: [], error: ctx.error };

  try {
    const [lessonSnap, reviewsSnap] = await Promise.all([
      db()
        .collection(COLLECTIONS.scheduledLessons)
        .where("parent_id", "==", ctx.profile.id)
        .get(),
      db()
        .collection(COLLECTIONS.lessonReviews)
        .where("parent_id", "==", ctx.profile.id)
        .get(),
    ]);

    const reviews = reviewsSnap.docs.map((d) => d.data() as LessonReview);
    const reviewByLesson = new Map(reviews.map((r) => [r.lesson_id, r]));
    const reviewedLessonIds = reviews.map((r) => r.lesson_id);

    const completed = lessonSnap.docs
      .map((d) => d.data() as ScheduledLesson)
      .filter(
        (l) =>
          l.status === "completed" &&
          new Date(l.slot_end).getTime() <= Date.now(),
      )
      .sort(
        (a, b) =>
          new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime(),
      )
      .slice(0, 20);

    const { listingMap, learnerMap } = await enrichLessonLabels(completed);

    const items: ParentReviewLessonItem[] = completed.map((l) => {
      const existing = reviewByLesson.get(l.id);
      const base = {
        lessonId: l.id,
        listingId: l.listing_id,
        listingHeadline: listingMap.get(l.listing_id) ?? "Verified tutor",
        learnerLabel: learnerMap.get(l.learner_id) ?? "Learner",
        slotStart: l.slot_start,
        slotEnd: l.slot_end,
        sequence: l.sequence,
      };

      if (!existing) {
        return { ...base, status: "pending" as const };
      }

      if (canEditReview(existing)) {
        return {
          ...base,
          status: "editable" as const,
          reviewId: existing.id,
          rating: existing.rating,
          body: existing.body,
          editHoursLeft: reviewEditHoursLeft(existing),
        };
      }

      return {
        ...base,
        status: "locked" as const,
        reviewId: existing.id,
        rating: existing.rating,
        body: existing.body,
      };
    });

    return { items, reviewedLessonIds };
  } catch {
    return {
      items: [],
      reviewedLessonIds: [],
      error: "Could not load lesson reviews.",
    };
  }
}

/** Pending-only helper kept for callers that only need write prompts. */
export async function listMyPendingLessonReviews(): Promise<{
  lessons: ParentReviewLessonItem[];
  error?: string;
}> {
  const board = await listMyLessonReviewBoard();
  return {
    lessons: board.items.filter((i) => i.status === "pending"),
    error: board.error,
  };
}

export async function getTutorReviewSummary(): Promise<{
  summary: TutorReviewSummary;
  error?: string;
}> {
  const empty: TutorReviewSummary = {
    ratingAvg: null,
    reviewCount: 0,
    recent: [],
  };
  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) return { summary: empty, error: ctx.error };

  try {
    const listingSnap = await db()
      .collection(COLLECTIONS.tutorListings)
      .doc(ctx.profile.id)
      .get();
    if (!listingSnap.exists) return { summary: empty };

    const listing = listingSnap.data() as TutorListing;
    return {
      summary: {
        ratingAvg: listing.rating_avg ?? null,
        reviewCount: listing.review_count ?? 0,
        recent: (listing.reviews ?? []).slice(0, 3),
      },
    };
  } catch {
    return { summary: empty, error: "Could not load reviews." };
  }
}
