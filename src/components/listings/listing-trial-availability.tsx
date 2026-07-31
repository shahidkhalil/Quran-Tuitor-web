import Link from "next/link";
import { previewSlotsByDay } from "@/domain/listing-trial-preview";
import type { TrialSlotOption } from "@/domain/trials";

type Props = {
  listingId: string;
  slots: TrialSlotOption[];
  availabilitySummary: string;
  timezoneLabel?: string | null;
  /** When false, still show summary but no book links (e.g. already converting). */
  bookable?: boolean;
  trialHref: string;
};

export function ListingTrialAvailability({
  listingId,
  slots,
  availabilitySummary,
  timezoneLabel,
  bookable = true,
  trialHref,
}: Props) {
  const days = previewSlotsByDay(slots, 8);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="display-title text-xl text-[var(--color-on-background)]">
          Next free trial slots
        </h2>
        {bookable ? (
          <Link
            href={trialHref}
            className="text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            See all times
          </Link>
        ) : null}
      </div>
      <p className="text-sm text-[var(--color-on-surface-muted)]">
        30-minute free trial · $0 · times in your local timezone
        {timezoneLabel ? (
          <>
            {" "}
            (tutor typically uses{" "}
            <span className="font-semibold text-[var(--color-on-surface)]">
              {timezoneLabel}
            </span>
            )
          </>
        ) : null}
        .
      </p>

      {availabilitySummary.trim() ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-4 py-3">
          <p className="text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
            Tutor notes
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-on-surface)]">
            {availabilitySummary}
          </p>
        </div>
      ) : null}

      {days.length === 0 ? (
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          No upcoming trial slots are open right now. Check back soon or message
          after booking.
        </p>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.dayKey}>
              <p className="mb-2 text-sm font-semibold text-[var(--color-on-surface)]">
                {day.dayLabel}
              </p>
              <ul className="flex flex-wrap gap-2">
                {day.slots.map((slot) => {
                  const href = bookable
                    ? `/browse/${listingId}/trial?slot=${encodeURIComponent(slot.start)}`
                    : trialHref;
                  return (
                    <li key={slot.start}>
                      {bookable ? (
                        <Link
                          href={href}
                          className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-accent-soft)]/40"
                        >
                          {slot.timeLabel}
                        </Link>
                      ) : (
                        <span className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-2 text-sm text-[var(--color-on-surface-muted)]">
                          {slot.timeLabel}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {bookable && days.length > 0 ? (
        <Link href={trialHref} className="btn-panel btn-panel-primary mt-1 inline-flex">
          Book free trial
        </Link>
      ) : null}
    </section>
  );
}
