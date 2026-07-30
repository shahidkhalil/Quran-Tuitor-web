import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { statusLabel } from "@/domain/tutor-applications";
import { enforcementStatusLabel } from "@/domain/tutor-enforcement";
import { getTutorEnforcement } from "@/server/actions/admin-enforcement";
import { getMyApplication } from "@/server/actions/tutor-applications";
import { getTutorReviewSummary } from "@/server/actions/reviews";
import { getMyListing } from "@/server/actions/tutor-listings";
import { getCurrentProfile } from "@/server/services/profile";
import Link from "next/link";

export const metadata = { title: "Tutor" };

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </>
        ) : null}
      </div>
    </>
  );
}
