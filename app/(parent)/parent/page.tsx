import { ActiveTutorsPanel } from "@/components/dashboard/active-tutors-panel";
import { HelpFaqPanel } from "@/components/dashboard/help-faq-panel";
import { LessonCountdownBanner } from "@/components/dashboard/lesson-countdown-banner";
import {
  DashboardBanners,
  NextStepBanner,
} from "@/components/dashboard/next-step-banner";
import { TutorDiscoveryTabs } from "@/components/dashboard/tutor-discovery-tabs";
import { TrustStrip } from "@/components/listings/trust-strip";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  PARENT_HELP_FAQS,
  parentNextStep,
} from "@/domain/dashboard-home";
import {
  pickNextCountdownLesson,
  type CountdownLesson,
} from "@/domain/lesson-countdown";
import { formatLessonSlot } from "@/domain/recurring-bookings";
import type { TutorListing } from "@/domain/tutor-listings";
import { getSessionEmailVerified } from "@/lib/firebase/server-auth";
import { listParentScheduleLessons } from "@/server/actions/attendance";
import { listLearners } from "@/server/actions/learners";
import { listMyMessageThreads } from "@/server/actions/messages";
import { listMyNotifications } from "@/server/actions/notifications";
import { listParentUpcomingLessons } from "@/server/actions/recurring-bookings";
import {
  getMyShortlistIds,
  getMyShortlistListings,
} from "@/server/actions/shortlist";
import { listMyTrialBookings } from "@/server/actions/trials";
import { listPublishedListings } from "@/server/actions/tutor-listings";
import { listParentPackageRenewalPrompts } from "@/server/actions/payments";
import { getCurrentProfile } from "@/server/services/profile";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
};

export default async function ParentHomePage() {
  const profile = await getCurrentProfile();
  const greeting = profile?.email?.split("@")[0] ?? "there";

  const [
    { learners },
    { bookings },
    { lessons },
    { calendarLessons },
    { listings: published },
    { listings: shortlisted },
    shortlistIds,
    emailVerified,
    { notifications },
    { threads },
    { prompts: renewalPrompts },
  ] = await Promise.all([
    listLearners(),
    listMyTrialBookings(),
    listParentUpcomingLessons(),
    listParentScheduleLessons(),
    listPublishedListings(),
    getMyShortlistListings(),
    getMyShortlistIds(),
    getSessionEmailVerified(),
    listMyNotifications(),
    listMyMessageThreads(),
    listParentPackageRenewalPrompts(),
  ]);

  const savedIds = shortlistIds.ids;
  const openTrials = bookings.filter(
    (b) =>
      b.status === "pending_tutor" ||
      b.status === "accepted" ||
      b.status === "completed",
  );
  const upcoming = lessons.length;
  const unreadNotifs = notifications.filter((n) => !n.read_at).length;
  const byListing = new Map(published.map((l) => [l.id, l]));

  const activeListingIds = new Set<string>();
  for (const b of bookings) {
    if (
      b.status === "pending_tutor" ||
      b.status === "accepted" ||
      b.status === "completed"
    ) {
      activeListingIds.add(b.listing_id);
    }
  }
  for (const l of lessons) {
    if (l.status === "scheduled") activeListingIds.add(l.listing_id);
  }

  const activeTutors = [...activeListingIds]
    .map((id) => {
      const listing = byListing.get(id);
      if (!listing) return null;
      const nextLesson = lessons.find((x) => x.listing_id === id);
      const trial = openTrials.find((x) => x.listing_id === id);
      return {
        listingId: id,
        headline: listing.headline,
        photoUrl: listing.photo_url,
        nextLabel: nextLesson
          ? `Next: ${formatLessonSlot(nextLesson.slot_start, nextLesson.slot_end)}`
          : trial
            ? `Trial: ${trial.status.replaceAll("_", " ")}`
            : "Active relationship",
        href: nextLesson ? "/parent/schedule" : "/parent/bookings",
        messageHref: "/parent/messages",
      };
    })
    .filter(Boolean) as {
    listingId: string;
    headline: string;
    photoUrl?: string | null;
    nextLabel: string;
    href: string;
    messageHref?: string;
  }[];

  const pastIds = new Set<string>();
  for (const l of calendarLessons) {
    if (l.status !== "scheduled") pastIds.add(l.listing_id);
  }
  for (const b of bookings) {
    if (
      b.status === "completed" ||
      b.status === "declined" ||
      b.status === "cancelled" ||
      b.status === "timed_out"
    ) {
      pastIds.add(b.listing_id);
    }
  }
  const pastListings = [...pastIds]
    .map((id) => byListing.get(id))
    .filter(Boolean) as TutorListing[];

  const recommended = published
    .filter((l) => !activeListingIds.has(l.id))
    .sort((a, b) => {
      const ra = a.rating_avg ?? 0;
      const rb = b.rating_avg ?? 0;
      if (rb !== ra) return rb - ra;
      return (b.review_count ?? 0) - (a.review_count ?? 0);
    })
    .slice(0, 6);

  const step = parentNextStep({
    learnerCount: learners.length,
    openTrialCount: openTrials.length,
    upcomingLessonCount: upcoming,
    shortlistCount: savedIds.length,
    hasActiveTutor: activeTutors.length > 0,
  });

  const banners = [];
  if (emailVerified === false) {
    banners.push({
      tone: "warning" as const,
      title: "Verify your email",
      body: "We sent a verification link. Confirm your email to keep your account secure.",
      href: "/parent/account",
      cta: "Account",
    });
  }
  if (learners.length === 0) {
    banners.push({
      tone: "info" as const,
      title: "Add your first learner",
      body: "Free trials need a learner profile (child or yourself as adult).",
      href: "/parent/learners",
      cta: "Add learner",
    });
  } else if (activeTutors.length === 0 && openTrials.length === 0) {
    banners.push({
      tone: "success" as const,
      title: "Free trial available",
      body: "Book a $0 free trial with a verified tutor — no card required.",
      href: "/browse",
      cta: "Find tutors",
    });
  }
  if (unreadNotifs > 0) {
    banners.push({
      tone: "info" as const,
      title: `${unreadNotifs} unread notification${unreadNotifs === 1 ? "" : "s"}`,
      body: "Check the bell in the header for lesson and booking updates.",
    });
  }
  for (const prompt of renewalPrompts.slice(0, 2)) {
    banners.push({
      tone: "warning" as const,
      title: prompt.title,
      body: prompt.body,
      href: prompt.href,
      cta: "Renew package",
    });
  }

  const statusText =
    learners.length === 0
      ? "Add a learner first, then browse verified tutors for a free trial."
      : openTrials.length > 0
        ? `You have ${openTrials.length} trial booking${openTrials.length === 1 ? "" : "s"} in progress.`
        : upcoming > 0
          ? `${upcoming} paid lesson${upcoming === 1 ? "" : "s"} coming up on your schedule.`
          : "Browse tutors, book a free trial, then continue with platform checkout.";

  const learnerName = new Map(learners.map((l) => [l.id, l.display_name]));
  const countdownCandidates: CountdownLesson[] = [
    ...lessons.map((l) => ({
      id: l.id,
      slot_start: l.slot_start,
      slot_end: l.slot_end,
      partyLabel:
        byListing.get(l.listing_id)?.headline ??
        learnerName.get(l.learner_id) ??
        "Paid lesson",
      meeting_url: l.meeting_url,
      kind: "paid" as const,
    })),
    ...bookings
      .filter((b) => b.status === "accepted")
      .map((b) => ({
        id: b.id,
        slot_start: b.slot_start,
        slot_end: b.slot_end,
        partyLabel:
          byListing.get(b.listing_id)?.headline ??
          learnerName.get(b.learner_id) ??
          "Free trial",
        meeting_url: b.meeting_url,
        kind: "trial" as const,
      })),
  ];
  const nextLesson = pickNextCountdownLesson(countdownCandidates);

  return (
    <>
      <PanelPageHeader
        eyebrow="Family workspace"
        title={`Welcome, ${greeting}`}
        description={statusText}
        actions={
          <Link href={step.href} className="btn-panel btn-panel-primary">
            {step.cta}
          </Link>
        }
      />

      <TrustStrip className="mb-4 text-sm text-[var(--color-on-surface-muted)]" />

      {nextLesson ? (
        <LessonCountdownBanner
          lesson={nextLesson}
          role="parent"
          scheduleHref="/parent/schedule"
        />
      ) : null}

      <DashboardBanners banners={banners} />
      <NextStepBanner step={step} />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/parent/learners"
          className="surface-card surface-card-interactive block p-4"
        >
          <p className="eyebrow text-[var(--color-accent)]">Learners</p>
          <p className="display-title mt-1 text-3xl text-[var(--color-primary)]">
            {learners.length}
          </p>
        </Link>
        <Link
          href="/parent/bookings"
          className="surface-card surface-card-interactive block p-4"
        >
          <p className="eyebrow text-[var(--color-accent)]">Trials</p>
          <p className="display-title mt-1 text-3xl text-[var(--color-primary)]">
            {openTrials.length}
          </p>
        </Link>
        <Link
          href="/parent/schedule"
          className="surface-card surface-card-interactive block p-4"
        >
          <p className="eyebrow text-[var(--color-accent)]">Upcoming</p>
          <p className="display-title mt-1 text-3xl text-[var(--color-primary)]">
            {upcoming}
          </p>
        </Link>
        <Link
          href="/parent/messages"
          className="surface-card surface-card-interactive block p-4"
        >
          <p className="eyebrow text-[var(--color-accent)]">Messages</p>
          <p className="display-title mt-1 text-3xl text-[var(--color-primary)]">
            {threads.length}
          </p>
          <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
            Threads
          </p>
        </Link>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <ActiveTutorsPanel tutors={activeTutors} />
        <TutorDiscoveryTabs
          recommended={recommended}
          shortlisted={shortlisted}
          past={pastListings}
          shortlistedIds={savedIds}
        />
      </div>

      <p className="eyebrow mb-3 text-[var(--color-accent)]">Family tools</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Link
          href="/parent/watch"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Oversight</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Parental Watch
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Attendance, progress, and upcoming per learner
          </p>
        </Link>
        <Link
          href="/parent/family"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Family</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Invite co-parent
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Share view-only Parental Watch with a partner
          </p>
        </Link>
        <Link
          href="/parent/revision"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Practice</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Revision & homework
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Homework assigned in tutor progress notes
          </p>
        </Link>
        <Link
          href="/parent/hifz"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Memorisation</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Hifz tracker
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Surah and ayah progress per learner
          </p>
        </Link>
        <Link
          href="/parent/archives"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">History</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Archives
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            Past lessons, notes, and trial outcomes
          </p>
        </Link>
        <Link
          href="/parent/help"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Support</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Help center
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            FAQs for trials, join links, and rematch
          </p>
        </Link>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="eyebrow mb-3 text-[var(--color-accent)]">Quick actions</p>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </div>
        <HelpFaqPanel faqs={PARENT_HELP_FAQS} moreHref="/parent/help" />
      </div>
    </>
  );
}
