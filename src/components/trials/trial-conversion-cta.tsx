import Link from "next/link";

type Props = {
  trialBookingId: string;
};

export function TrialConversionCta({ trialBookingId }: Props) {
  return (
    <div className="mt-5 max-w-lg space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-success)]/20 bg-[var(--color-accent-soft)]/60 px-4 py-4">
      <p className="text-sm font-semibold text-[var(--color-on-surface)]">
        Ready for weekly lessons?
      </p>
      <p className="text-sm text-[var(--color-on-surface-muted)]">
        Continue to a 4-lesson package through platform checkout. The free trial
        stays $0 — never pay the tutor directly.
      </p>
      <Link
        href={`/parent/checkout?from_trial=${encodeURIComponent(trialBookingId)}`}
        className="btn-panel btn-panel-primary"
      >
        Continue to paid lessons
      </Link>
    </div>
  );
}
