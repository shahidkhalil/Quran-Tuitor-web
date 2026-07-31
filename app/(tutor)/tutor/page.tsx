import { HelpFaqPanel } from "@/components/dashboard/help-faq-panel";
import { LessonCountdownBanner } from "@/components/dashboard/lesson-countdown-banner";
import {
  DashboardBanners,
  type DashboardBanner,
} from "@/components/dashboard/next-step-banner";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  TUTOR_HELP_FAQS,
  tutorProfileCompleteness,
} from "@/domain/dashboard-home";
import {
  pickNextCountdownLesson,
  type CountdownLesson,
} from "@/domain/lesson-countdown";
import { statusLabel } from "@/domain/tutor-applications";
import { enforcementStatusLabel } from "@/domain/tutor-enforcement";
import {
  fieldLabel,
  missingPublishFields,
} from "@/domain/tutor-listings";
import { formatLessonSlot } from "@/domain/recurring-bookings";
import { toLocalIsoDate } from "@/domain/calendar";
import { joinViaSystemCheck } from "@/domain/system-check";
import { getTutorEnforcement } from "@/server/actions/admin-enforcement";
import { listTutorCalendarLessons } from "@/server/actions/attendance";
import { getTutorPayoutDashboard } from "@/server/actions/payouts";
import { getTutorReviewSummary } from "@/server/actions/reviews";
import { getMyApplication } from "@/server/actions/tutor-applications";
import { listTutorTrialBookings } from "@/server/actions/trials";
import { getMyListing } from "@/server/actions/tutor-listings";
import { getCurrentProfile } from "@/server/services/profile";
import { COLLECTIONS, db } from "@/lib/firebase/db";
import Link from "next/link";

export const metadata = { title: "Tutor" };

function formatUsd(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function TutorHomePage() {
  const profile = await getCurrentProfile();
  const { application } = await getMyApplication();
  const isVerified = profile?.role === "tutor";
  const { listing } = isVerified ? await getMyListing() : { listing: null };
  const { summary } = isVerified
    ? await getTutorReviewSummary()
    : {
        summary: { ratingAvg: null, reviewCount: 0, recent: [] },
      };
  const enforcement = profile
    ? await getTutorEnforcement(profile.id)
    : null;

  const payout = isVerified
    ? await getTutorPayoutDashboard()
    : null;
  const { lessons: calendarLessons } = isVerified
    ? await listTutorCalendarLessons()
    : { lessons: [] };
  const { bookings: tutorTrials } = isVerified
    ? await listTutorTrialBookings()
    : { bookings: [] };

  const todayIso = toLocalIsoDate(new Date());
  const todayLessons = calendarLessons.filter(
    (l) => toLocalIsoDate(new Date(l.slot_start)) === todayIso,
  );

  const learnerIds = [
    ...new Set([
      ...calendarLessons.map((l) => l.learner_id),
      ...tutorTrials.map((t) => t.learner_id),
    ]),
  ];
  const learnerNames = new Map<string, string>();
  await Promise.all(
    learnerIds.slice(0, 40).map(async (id) => {
      const snap = await db().collection(COLLECTIONS.learnerProfiles).doc(id).get();
      learnerNames.set(
        id,
        (snap.data() as { display_name?: string } | undefined)?.display_name ??
          "Learner",
      );
    }),
  );

  const countdownCandidates: CountdownLesson[] = [
    ...calendarLessons
      .filter((l) => l.status === "scheduled")
      .map((l) => ({
        id: l.id,
        slot_start: l.slot_start,
        slot_end: l.slot_end,
        partyLabel: learnerNames.get(l.learner_id) ?? "Learner",
        meeting_url: l.meeting_url,
        kind: "paid" as const,
      })),
    ...tutorTrials
      .filter((t) => t.status === "accepted")
      .map((t) => ({
        id: t.id,
        slot_start: t.slot_start,
        slot_end: t.slot_end,
        partyLabel: learnerNames.get(t.learner_id) ?? "Trial learner",
        meeting_url: t.meeting_url,
        kind: "trial" as const,
      })),
  ];
  const nextLesson = pickNextCountdownLesson(countdownCandidates);

  const missing = listing ? missingPublishFields(listing) : [];
  const completeness = tutorProfileCompleteness({
    missingFieldLabels: missing.map(fieldLabel),
    published: Boolean(listing?.published),
    hasPhoto: Boolean(listing?.photo_url || profile?.photo_url),
    hasIntroVideo: Boolean(listing?.intro_video_url?.trim()),
    hasIntroAudio: Boolean(listing?.intro_audio_url?.trim()),
    payoutsEnabled: Boolean(payout?.payoutsEnabled),
    hasConnectAccount: Boolean(payout?.connectAccountId),
  });

  const banners: DashboardBanner[] = [];
  if (isVerified && listing && !listing.published) {
    banners.push({
      tone: "info",
      title: "Publish your listing",
      body: "Parents only see published listings. Finish required fields and go live.",
      href: "/tutor/listing",
      cta: "Open listing",
    });
  }
  if (isVerified && payout && !payout.payoutsEnabled) {
    banners.push({
      tone: "warning",
      title: "Connect payouts",
      body: "Set up Stripe Connect so you can withdraw lesson earnings.",
      href: "/tutor/earnings",
      cta: "Earnings",
    });
  }
  if (isVerified && !completeness.hasPhoto) {
    banners.push({
      tone: "info",
      title: "Add a profile photo",
      body: "Listings with photos get more trial requests.",
      href: "/tutor/account",
      cta: "Account",
    });
  }
  if (
    isVerified &&
    listing?.published &&
    !completeness.hasIntroVideo
  ) {
    banners.push({
      tone: "success",
      title: "Add an intro video",
      body: "A short YouTube clip helps families trust your teaching style before a free trial.",
      href: "/tutor/listing",
      cta: "Add video URL",
    });
  }
  if (
    isVerified &&
    listing?.published &&
    !completeness.hasIntroAudio
  ) {
    banners.push({
      tone: "success",
      title: "Add a voice sample",
      body: "A short recitation or greeting lets parents hear your voice before booking.",
      href: "/tutor/listing",
      cta: "Add voice",
    });
  }

  const statusText = isVerified
    ? listing?.published
      ? "Your listing is live for parents to discover."
      : "Complete and publish your listing so parents can find you."
    : application
      ? `Application: ${statusLabel(application.status)}.`
      : "Complete your application so our team can review your credentials and intro.";

  return (
    <>
      <PanelPageHeader
        eyebrow={isVerified ? "Verified tutor" : "Applicant"}
        title="Tutor home"
        description={statusText}
        actions={
          isVerified ? (
            <Link href="/tutor/requests" className="btn-panel btn-panel-primary">
              Trial requests
            </Link>
          ) : (
            <Link
              href="/tutor/application"
              className="btn-panel btn-panel-primary"
            >
              {application ? "View application" : "Start application"}
            </Link>
          )
        }
      />

      {enforcement &&
      enforcement.enforcement_status !== "clear" ? (
        <div
          role="status"
          className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 px-4 py-3 text-sm"
        >
          <p className="font-semibold text-[var(--color-on-surface)]">
            Account status:{" "}
            {enforcementStatusLabel(enforcement.enforcement_status)}
          </p>
          <p className="mt-1 text-[var(--color-on-surface-muted)]">
            {enforcement.enforcement_status === "warned"
              ? "You received a policy warning. Continue teaching carefully — contact Support in-platform if you need help."
              : enforcement.enforcement_public_message ||
                "New bookings and publishing are restricted until the platform reinstates your account."}
          </p>
        </div>
      ) : null}

      <DashboardBanners banners={banners} />

      {isVerified && nextLesson ? (
        <LessonCountdownBanner
          lesson={nextLesson}
          role="tutor"
          scheduleHref="/tutor/calendar"
        />
      ) : null}

      {isVerified ? (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <section className="surface-card p-5">
            <p className="eyebrow text-[var(--color-accent)]">Profile</p>
            <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
              Completeness
            </h2>
            <p className="mt-3 display-title text-3xl text-[var(--color-primary)]">
              {completeness.percent}%
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: `${completeness.percent}%` }}
              />
            </div>
            {completeness.missingLabels.length > 0 ? (
              <p className="mt-3 text-xs text-[var(--color-on-surface-muted)]">
                Still needed: {completeness.missingLabels.join(" · ")}
              </p>
            ) : (
              <p className="mt-3 text-xs text-[var(--color-success)]">
                Listing and payouts look ready.
              </p>
            )}
            <Link
              href="/tutor/listing"
              className="btn-panel btn-panel-secondary mt-4 !min-h-9"
            >
              Improve listing
            </Link>
          </section>

          <section className="surface-card p-5">
            <p className="eyebrow text-[var(--color-accent)]">Earnings</p>
            <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
              Available
            </h2>
            <p className="mt-3 display-title text-3xl text-[var(--color-primary)]">
              {formatUsd(payout?.availableCents ?? 0)}
            </p>
            <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
              {payout?.payoutsEnabled
                ? "Payouts enabled · request from Earnings"
                : "Connect Stripe to withdraw"}
            </p>
            <Link
              href="/tutor/earnings"
              className="btn-panel btn-panel-primary mt-4 !min-h-9"
            >
              Open earnings
            </Link>
          </section>

          <section className="surface-card p-5">
            <p className="eyebrow text-[var(--color-accent)]">Today</p>
            <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
              Students today
            </h2>
            <p className="mt-3 display-title text-3xl text-[var(--color-primary)]">
              {todayLessons.length}
            </p>
            <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
              Paid lessons on {new Date().toLocaleDateString()}
            </p>
            <Link
              href="/tutor/calendar"
              className="btn-panel btn-panel-secondary mt-4 !min-h-9"
            >
              Open calendar
            </Link>
          </section>
        </div>
      ) : null}

      {isVerified && todayLessons.length > 0 ? (
        <section className="mb-6 surface-card p-5 sm:p-6">
          <p className="eyebrow text-[var(--color-accent)]">Schedule</p>
          <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
            Today&apos;s lessons
          </h2>
          <ul className="mt-4 space-y-2">
            {todayLessons.slice(0, 6).map((lesson) => (
              <li
                key={lesson.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-2.5 text-sm"
              >
                <span className="font-semibold text-[var(--color-on-surface)]">
                  {formatLessonSlot(lesson.slot_start, lesson.slot_end)}
                </span>
                <span className="status-pill status-pill-neutral">
                  {lesson.status.replaceAll("_", " ")}
                </span>
                {lesson.meeting_url && lesson.status === "scheduled" ? (
                  <a
                    href={joinViaSystemCheck(lesson.meeting_url, "tutor")}
                    className="btn-panel btn-panel-primary !min-h-9"
                  >
                    Join
                  </a>
                ) : (
                  <Link
                    href="/tutor/calendar"
                    className="btn-panel btn-panel-secondary !min-h-9"
                  >
                    Details
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isVerified ? (
        <section className="mb-6 surface-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-[var(--color-accent)]">Parent feedback</p>
              <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
                Reviews on your listing
              </h2>
            </div>
            {listing?.published ? (
              <Link
                href={`/browse/${listing.id}`}
                className="btn-panel btn-panel-secondary"
              >
                View public profile
              </Link>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-6">
            <div>
              <p className="display-title text-3xl text-[var(--color-primary)]">
                {summary.ratingAvg != null ? summary.ratingAvg.toFixed(1) : "—"}
              </p>
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                {summary.reviewCount > 0
                  ? `${summary.reviewCount} review${summary.reviewCount === 1 ? "" : "s"}`
                  : "No reviews yet"}
              </p>
            </div>
          </div>
          {summary.recent.length > 0 ? (
            <ul className="mt-4 space-y-3 border-t border-[var(--color-outline)] pt-4">
              {summary.recent.map((review) => (
                <li key={review.id} className="text-sm">
                  <p className="font-semibold text-[var(--color-on-surface)]">
                    {review.author_display} · {review.rating}/5
                  </p>
                  <p className="mt-1 text-[var(--color-on-surface-muted)]">
                    {review.body}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
              Reviews appear after parents complete paid lessons.
            </p>
          )}
        </section>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/tutor/application"
          className="surface-card surface-card-interactive block p-5"
        >
          <p className="eyebrow text-[var(--color-accent)]">Onboarding</p>
          <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
            Application
          </p>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            {application
              ? statusLabel(application.status)
              : "Submit credentials for review"}
          </p>
        </Link>

        {isVerified ? (
          <>
            <Link
              href="/tutor/listing"
              className="surface-card surface-card-interactive block p-5"
            >
              <p className="eyebrow text-[var(--color-accent)]">Marketplace</p>
              <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
                Listing
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                {listing?.published
                  ? "Published · edit anytime"
                  : "Draft · publish to go live"}
              </p>
            </Link>
            <Link
              href="/tutor/requests"
              className="surface-card surface-card-interactive block p-5"
            >
              <p className="eyebrow text-[var(--color-accent)]">Pipeline</p>
              <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
                Trial requests
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                Accept, join, and summarise trials
              </p>
            </Link>
            <Link
              href="/tutor/calendar"
              className="surface-card surface-card-interactive block p-5"
            >
              <p className="eyebrow text-[var(--color-accent)]">Teaching</p>
              <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
                Calendar
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                Upcoming paid package lessons
              </p>
            </Link>
            <Link
              href="/tutor/earnings"
              className="surface-card surface-card-interactive block p-5"
            >
              <p className="eyebrow text-[var(--color-accent)]">Ledger</p>
              <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
                Earnings
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                Trial stipends, lesson net, and payouts
              </p>
            </Link>
            <Link
              href="/tutor/support"
              className="surface-card surface-card-interactive block p-5"
            >
              <p className="eyebrow text-[var(--color-accent)]">Help</p>
              <p className="display-title mt-2 text-xl text-[var(--color-primary)]">
                Support
              </p>
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                Cases and platform questions
              </p>
            </Link>
          </>
        ) : null}
      </div>

      {isVerified ? (
        <HelpFaqPanel faqs={TUTOR_HELP_FAQS} moreHref="/tutor/help" />
      ) : null}
    </>
  );
}
