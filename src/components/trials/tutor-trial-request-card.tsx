import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrialSummaryForm } from "@/components/trials/trial-summary-form";
import {
  canSubmitTrialSummary,
  formatSlotLabel,
  trialStatusLabel,
  type TrialBooking,
} from "@/domain/trials";
import {
  acceptTrialRequest,
  declineTrialRequest,
} from "@/server/actions/trials";

type Props = {
  booking: TrialBooking;
  learnerName: string;
};

function statusPillClass(status: TrialBooking["status"]) {
  if (status === "pending_tutor") return "status-pill status-pill-warning";
  if (status === "accepted" || status === "completed")
    return "status-pill status-pill-success";
  if (status === "declined" || status === "timed_out")
    return "status-pill status-pill-error";
  return "status-pill status-pill-neutral";
}

export function TutorTrialRequestCard({ booking, learnerName }: Props) {
  const start = new Date(booking.slot_start);
  const end = new Date(booking.slot_end);
  const pending = booking.status === "pending_tutor";
  const accepted = booking.status === "accepted";
  const completed = booking.status === "completed";
  const showSummaryForm = canSubmitTrialSummary(booking);
  const showJoin = (accepted || completed) && Boolean(booking.meeting_url);

  return (
    <li className="surface-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="status-pill status-pill-accent">Free trial</span>
            <span className={statusPillClass(booking.status)}>
              {trialStatusLabel(booking.status)}
            </span>
          </div>
          <h2 className="display-title text-xl text-[var(--color-primary)]">
            {learnerName}
          </h2>
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            {formatSlotLabel(start, end)}
          </p>
          {pending ? (
            <p className="text-sm font-semibold text-[var(--color-warning)]">
              Respond by {new Date(booking.expires_at).toLocaleString()}
            </p>
          ) : null}
          {showJoin && booking.meeting_url ? (
            <a
              href={booking.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-panel btn-panel-primary mt-1"
            >
              Join lesson
            </a>
          ) : null}
          {completed && booking.summary ? (
            <div className="mt-2 space-y-1 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm">
              <p>
                <span className="font-semibold">Summary: </span>
                {booking.summary}
              </p>
              {booking.recommendation ? (
                <p>
                  <span className="font-semibold">Recommendation: </span>
                  {booking.recommendation}
                </p>
              ) : null}
            </div>
          ) : null}
          {showSummaryForm ? <TrialSummaryForm bookingId={booking.id} /> : null}
          {accepted && !showSummaryForm ? (
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              After the scheduled end time, you can submit a lesson summary
              here.
            </p>
          ) : null}
        </div>

        {pending ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <form action={acceptTrialRequest}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <Button type="submit">Accept</Button>
            </form>
            <form action={declineTrialRequest}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <Button type="submit" variant="secondary">
                Decline
              </Button>
            </form>
          </div>
        ) : null}

        {(booking.status === "declined" || booking.status === "timed_out") && (
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            Slot freed — parent can book again.
          </p>
        )}
      </div>
    </li>
  );
}

export function TutorTrialRequestsEmpty() {
  return (
    <div className="surface-card px-5 py-12 text-center">
      <p className="display-title text-xl text-[var(--color-primary)]">
        No trial requests yet
      </p>
      <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
        When a parent books a free trial with you, it will show up here for
        accept or decline within 24 hours.
      </p>
      <Link
        href="/tutor/listing"
        className="btn-panel btn-panel-secondary mt-5"
      >
        Check your listing
      </Link>
    </div>
  );
}
