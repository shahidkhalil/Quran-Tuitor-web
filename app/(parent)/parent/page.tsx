import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { listLearners } from "@/server/actions/learners";
import { listParentUpcomingLessons } from "@/server/actions/recurring-bookings";
import { listMyTrialBookings } from "@/server/actions/trials";
import { getCurrentProfile } from "@/server/services/profile";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
};

export default async function ParentHomePage() {
  const profile = await getCurrentProfile();
  const greeting = profile?.email?.split("@")[0] ?? "there";

  const [{ learners }, { bookings }, { lessons }] = await Promise.all([
    listLearners(),
    listMyTrialBookings(),
    listParentUpcomingLessons(),
  ]);

  const openTrials = bookings.filter(
    (b) =>
      b.status === "pending_tutor" ||
      b.status === "accepted" ||
      b.status === "completed",
  ).length;
  const upcoming = lessons.length;

  const statusText =
    learners.length === 0
      ? "Add a learner first, then browse verified tutors for a free trial."
      : openTrials > 0
        ? `You have ${openTrials} trial booking${openTrials === 1 ? "" : "s"} in progress.`
        : upcoming > 0
          ? `${upcoming} paid lesson${upcoming === 1 ? "" : "s"} coming up on your schedule.`
          : "Browse tutors, book a free trial, then continue with platform checkout.";

  return (
    <>
      <PanelPageHeader
        eyebrow="Family workspace"
        title={`Welcome, ${greeting}`}
        description={statusText}
        actions={
          <Link href="/browse" className="btn-panel btn-panel-primary">
            Find tutors
          </Link>
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Link href="/parent/learners" className="surface-card surface-card-interactive block p-4">
          <p className="eyebrow text-[var(--color-accent)]">Learners</p>
          <p className="display-title mt-1 text-3xl text-[var(--color-primary)]">
            {learners.length}
          </p>
          <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
            Profiles ready to book
          </p>
        </Link>
        <Link href="/parent/bookings" className="surface-card surface-card-interactive block p-4">
          <p className="eyebrow text-[var(--color-accent)]">Trials</p>
          <p className="display-title mt-1 text-3xl text-[var(--color-primary)]">
            {openTrials}
          </p>
          <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
            Free trials in progress
          </p>
        </Link>
        <Link href="/parent/schedule" className="surface-card surface-card-interactive block p-4">
          <p className="eyebrow text-[var(--color-accent)]">Upcoming</p>
          <p className="display-title mt-1 text-3xl text-[var(--color-primary)]">
            {upcoming}
          </p>
          <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
            Paid lessons scheduled
          </p>
        </Link>
      </div>

      <p className="eyebrow mb-3 text-[var(--color-accent)]">Quick actions</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/browse"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Marketplace</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Find a tutor
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Free trial · $0 · then paid packages through the platform
          </p>
        </Link>

        <Link
          href="/parent/learners"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Family</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Learners
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            {learners.length === 0
              ? "Add a child or yourself to start booking"
              : `${learners.length} profile${learners.length === 1 ? "" : "s"} ready`}
          </p>
        </Link>

        <Link
          href="/parent/bookings"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Trials</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Bookings
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Join links, summaries, and continue to paid lessons
          </p>
        </Link>

        <Link
          href="/parent/schedule"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Paid lessons</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Schedule
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            {upcoming > 0
              ? `${upcoming} upcoming lesson${upcoming === 1 ? "" : "s"}`
              : "Set a weekly time after checkout"}
          </p>
        </Link>

        <Link
          href="/shortlist"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Saved</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Shortlist
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Compare tutors you saved while browsing
          </p>
        </Link>

        <Link
          href="/parent/messages"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Inbox</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Messages
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Parent-visible threads with tutors
          </p>
        </Link>
      </div>
    </>
  );
}
