import Link from "next/link";
import { ReviewLessonForm } from "@/components/reviews/review-lesson-form";
import { CreateRecurringScheduleForm } from "@/components/schedule/create-recurring-schedule-form";
import {
  LessonCalendar,
  type CalendarLessonItem,
} from "@/components/schedule/lesson-calendar";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { formatUsdCents } from "@/domain/payments";
import type { ScheduledLesson } from "@/domain/recurring-bookings";
import { weekdayLabel } from "@/domain/recurring-bookings";
import { listParentScheduleLessons } from "@/server/actions/attendance";
import { getScheduleContextFromPayment } from "@/server/actions/recurring-bookings";
import { listMyLessonReviewBoard } from "@/server/actions/reviews";
import { getPublishedListingById } from "@/server/actions/tutor-listings";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Schedule" };

type Props = {
  searchParams: Promise<{ payment_id?: string; created?: string }>;
};

async function withTutorLabels(
  lessons: ScheduledLesson[],
): Promise<CalendarLessonItem[]> {
  const ids = [...new Set(lessons.map((l) => l.listing_id))];
  const titles = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const { listing } = await getPublishedListingById(id);
      titles.set(id, listing?.headline ?? "Verified tutor");
    }),
  );
  return lessons.map((l) => ({
    ...l,
    partyLabel: titles.get(l.listing_id) ?? "Verified tutor",
  }));
}

export default async function ParentSchedulePage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/parent/schedule");
  if (profile.role !== "parent" && profile.role !== "adult") redirect("/");

  const { payment_id: paymentId, created } = await searchParams;

  if (!paymentId) {
    const { calendarLessons, upcoming, error } =
      await listParentScheduleLessons();
    const {
      items: reviewItems,
      reviewedLessonIds,
      error: reviewError,
    } = await listMyLessonReviewBoard();
    const items = await withTutorLabels(
      calendarLessons.length > 0 ? calendarLessons : upcoming,
    );
    const actionableReviews = reviewItems.filter(
      (i) => i.status === "pending" || i.status === "editable",
    );
    const lockedReviews = reviewItems.filter((i) => i.status === "locked");

    return (
      <div>
        <PanelPageHeader
          eyebrow="Calendar"
          title="Your schedule"
        description="Month view of paid lessons — tap a completed day for Progress notes and reviews."
        actions={
          <Link href="/parent/learners" className="btn-panel btn-panel-secondary">
            Learners &amp; progress
          </Link>
        }
        />
        {error ? (
          <p role="alert" className="mb-4 text-sm text-[var(--color-error)]">
            {error}
          </p>
        ) : null}
        <LessonCalendar
          lessons={items}
          emptyTitle="No lessons on the calendar"
          emptyBody="After you pay for a package and set a weekly time, sessions show here with join links."
          helpHref="/parent/bookings"
          helpLabel="Go to bookings"
          showTutorNoShowHelp
          reviewedLessonIds={reviewedLessonIds}
        />
        {reviewError ? (
          <p role="alert" className="mt-6 text-sm text-[var(--color-error)]">
            {reviewError}
          </p>
        ) : null}
        {actionableReviews.length > 0 || lockedReviews.length > 0 ? (
          <section id="lesson-reviews" className="mt-8 space-y-4">
            <div>
              <p className="eyebrow text-[var(--color-accent)]">Trust & feedback</p>
              <h2 className="display-title mt-1 text-2xl text-[var(--color-primary)]">
                Lesson reviews
              </h2>
              <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                Reviews appear on tutor profiles. You can edit a review within
                24 hours of submitting it.
              </p>
            </div>
            {actionableReviews.length > 0 ? (
              <ul className="space-y-3">
                {actionableReviews.map((lesson) => (
                  <li key={lesson.lessonId} className="surface-card p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={
                          lesson.status === "pending"
                            ? "status-pill status-pill-warning"
                            : "status-pill status-pill-accent"
                        }
                      >
                        {lesson.status === "pending"
                          ? "Review due"
                          : "Editable"}
                      </span>
                      <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                        {lesson.listingHeadline}
                      </p>
                    </div>
                    <p className="mb-3 text-xs text-[var(--color-on-surface-muted)]">
                      Lesson {lesson.sequence} · {lesson.learnerLabel} ·{" "}
                      {new Date(lesson.slotStart).toLocaleString()}
                    </p>
                    {lesson.status === "pending" ? (
                      <ReviewLessonForm lessonId={lesson.lessonId} />
                    ) : (
                      <ReviewLessonForm
                        lessonId={lesson.lessonId}
                        mode="edit"
                        reviewId={lesson.reviewId}
                        defaultRating={lesson.rating}
                        defaultBody={lesson.body}
                        editHoursLeft={lesson.editHoursLeft}
                      />
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
            {lockedReviews.length > 0 ? (
              <ul className="space-y-3">
                {lockedReviews.map((lesson) => (
                  <li
                    key={lesson.lessonId}
                    className="surface-card space-y-2 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="status-pill status-pill-success">
                        Reviewed
                      </span>
                      <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                        {lesson.listingHeadline}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--color-on-surface-muted)]">
                      Lesson {lesson.sequence} · {lesson.rating}/5 ·{" "}
                      {new Date(lesson.slotStart).toLocaleString()}
                    </p>
                    {lesson.body ? (
                      <p className="text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
                        {lesson.body}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}
      </div>
    );
  }

  const ctx = await getScheduleContextFromPayment(paymentId);

  return (
    <div>
      <PanelPageHeader
        eyebrow="Paid package"
        title={
          ctx.existingBooking ? "Schedule confirmed" : "Set weekly schedule"
        }
        description="Pick a weekday and time. We’ll lock in your package lessons with this verified tutor."
      />

      {created ? (
        <p
          role="status"
          className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Recurring schedule saved. Open the calendar below for join links on
          each lesson.
        </p>
      ) : null}

      {ctx.error ? (
        <div className="surface-card space-y-4 p-5">
          <p role="alert" className="text-sm text-[var(--color-error)]">
            {ctx.error}
          </p>
          <Link
            href="/parent/bookings"
            className="btn-panel btn-panel-secondary"
          >
            Back to bookings
          </Link>
        </div>
      ) : ctx.existingBooking && ctx.payment ? (
        <div className="space-y-6">
          <div className="surface-card space-y-2 p-5 text-sm">
            <p>
              <span className="text-[var(--color-on-surface-muted)]">Tutor: </span>
              <span className="font-semibold">
                {ctx.listingHeadline ?? "Verified tutor"}
              </span>
            </p>
            <p>
              <span className="text-[var(--color-on-surface-muted)]">
                Cadence:{" "}
              </span>
              Weekly · {weekdayLabel(ctx.existingBooking.weekday)} ·{" "}
              {ctx.existingBooking.local_time} ({ctx.existingBooking.timezone})
            </p>
            <p>
              <span className="text-[var(--color-on-surface-muted)]">
                Package:{" "}
              </span>
              {ctx.payment.lesson_count} lessons ·{" "}
              {formatUsdCents(ctx.payment.amount_cents)} paid
            </p>
          </div>
          <LessonCalendar
            lessons={ctx.existingLessons.map((l) => ({
              ...l,
              partyLabel: ctx.listingHeadline ?? "Verified tutor",
            }))}
            helpHref="/parent/bookings"
            helpLabel="Go to bookings"
            showTutorNoShowHelp
          />
          <Link
            href="/parent/schedule"
            className="inline-flex text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            Open full calendar
          </Link>
        </div>
      ) : ctx.payment ? (
        <div className="surface-card p-5 md:p-6">
          <CreateRecurringScheduleForm
            paymentId={ctx.payment.id}
            lessonCount={ctx.payment.lesson_count}
            listingHeadline={ctx.listingHeadline ?? "Verified tutor"}
            learnerName={ctx.learnerName}
          />
        </div>
      ) : null}
    </div>
  );
}
