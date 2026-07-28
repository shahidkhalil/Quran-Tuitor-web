import { TrustStrip } from "@/components/listings/trust-strip";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { TrialConversionCta } from "@/components/trials/trial-conversion-cta";
import {
  canShowConversionCta,
  formatSlotLabel,
  trialStatusLabel,
  type TrialBooking,
} from "@/domain/trials";
import { listMyTrialBookings } from "@/server/actions/trials";
import { getPublishedListingById } from "@/server/actions/tutor-listings";
import { getCurrentProfile } from "@/server/services/profile";
import Link from "next/link";

export const metadata = { title: "Bookings" };

type Props = {
  searchParams: Promise<{ booked?: string; help?: string }>;
};

function statusPillClass(status: TrialBooking["status"]) {
  if (status === "pending_tutor") return "status-pill status-pill-warning";
  if (status === "accepted" || status === "completed")
    return "status-pill status-pill-success";
  if (status === "declined" || status === "timed_out")
    return "status-pill status-pill-error";
  return "status-pill status-pill-neutral";
}

async function bookingTitle(booking: TrialBooking): Promise<string> {
  const { listing } = await getPublishedListingById(booking.listing_id);
  return listing?.headline ?? "Verified tutor";
}

export default async function ParentBookingsPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  const { booked, help } = await searchParams;
  const { bookings, error } = await listMyTrialBookings();

  const titles = new Map<string, string>();
  await Promise.all(
    bookings.map(async (b) => {
      titles.set(b.id, await bookingTitle(b));
    }),
  );

  return (
    <div>
      <PanelPageHeader
        eyebrow="Trials"
        title="Bookings"
        description="Free trials, join links, tutor summaries, and the path to paid weekly lessons."
        actions={
          <Link href="/browse" className="btn-panel btn-panel-primary">
            Book a free trial
          </Link>
        }
      />

      <div className="mb-6">
        <TrustStrip />
      </div>

      {booked ? (
        <p
          role="status"
          className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Free trial requested ($0). Waiting for the tutor to accept within 24
          hours.
        </p>
      ) : null}

      {help === "tutor-no-show" ? (
        <div
          role="status"
          className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-error)]/25 bg-[var(--color-error)]/5 px-4 py-3 text-sm"
        >
          <p className="font-semibold text-[var(--color-on-surface)]">
            Tutor no-show — rematch support
          </p>
          <p className="mt-1 text-[var(--color-on-surface-muted)]">
            A paid lesson was marked as tutor no-show. Review attendance on your
            schedule, or browse another verified tutor.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/parent/schedule" className="btn-panel btn-panel-secondary">
              Review schedule
            </Link>
            <Link href="/browse" className="btn-panel btn-panel-primary">
              Find another tutor
            </Link>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mb-6 text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : null}

      {!profile ? (
        <div className="surface-card px-5 py-12 text-center">
          <p className="display-title text-xl text-[var(--color-primary)]">
            Sign in to view bookings
          </p>
          <Link
            href="/sign-in?next=/parent/bookings"
            className="btn-panel btn-panel-primary mt-5"
          >
            Sign in
          </Link>
        </div>
      ) : bookings.length === 0 ? (
        <div className="surface-card px-5 py-14 text-center">
          <p className="eyebrow text-[var(--color-accent)]">No trials yet</p>
          <p className="display-title mt-2 text-2xl text-[var(--color-primary)]">
            Book your first free trial
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-on-surface-muted)]">
            Meet a verified tutor online — no card required. After the trial,
            continue to a paid package only through the platform.
          </p>
          <Link href="/browse" className="btn-panel btn-panel-primary mt-6">
            Browse tutors
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => {
            const start = new Date(booking.slot_start);
            const end = new Date(booking.slot_end);
            const waiting = booking.status === "pending_tutor";
            const showJoin =
              (booking.status === "accepted" ||
                booking.status === "completed") &&
              booking.meeting_url;
            const showCta = canShowConversionCta(booking);

            return (
              <li key={booking.id} className="surface-card p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="status-pill status-pill-accent">
                        Free trial · $0
                      </span>
                      <span className={statusPillClass(booking.status)}>
                        {trialStatusLabel(booking.status)}
                      </span>
                    </div>
                    <h2 className="display-title mt-3 text-xl text-[var(--color-primary)]">
                      {titles.get(booking.id) ?? "Tutor"}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                      {formatSlotLabel(start, end)}
                    </p>
                    {waiting ? (
                      <p className="mt-2 text-sm font-semibold text-[var(--color-warning)]">
                        Tutor responds by{" "}
                        {new Date(booking.expires_at).toLocaleString()}
                      </p>
                    ) : null}
                    {showJoin && booking.meeting_url ? (
                      <a
                        href={booking.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-panel btn-panel-primary mt-4"
                      >
                        Join lesson
                      </a>
                    ) : null}
                    {booking.summary ? (
                      <div className="mt-4 space-y-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm">
                        <p>
                          <span className="font-semibold">Tutor summary: </span>
                          {booking.summary}
                        </p>
                        {booking.recommendation ? (
                          <p>
                            <span className="font-semibold">
                              Recommendation:{" "}
                            </span>
                            {booking.recommendation}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {showCta ? (
                      <TrialConversionCta trialBookingId={booking.id} />
                    ) : null}
                    {(booking.status === "declined" ||
                      booking.status === "timed_out") && (
                      <Link
                        href="/browse"
                        className="btn-panel btn-panel-secondary mt-4"
                      >
                        Book another tutor
                      </Link>
                    )}
                  </div>
                  <Link
                    href={`/browse/${booking.listing_id}`}
                    className="btn-panel btn-panel-secondary"
                  >
                    View profile
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
