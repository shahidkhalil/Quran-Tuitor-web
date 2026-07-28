import Link from "next/link";
import type { TutorListing } from "@/domain/tutor-listings";
import {
  ageBandLabel,
  SUBJECT_OPTIONS,
  timezoneLabel,
} from "@/domain/tutor-listings";

type Props = {
  listing: TutorListing | null;
};

function subjectLabels(listing: TutorListing) {
  return listing.subjects
    .map(
      (s) => SUBJECT_OPTIONS.find((o) => o.value === s)?.label ?? s,
    )
    .join(" · ");
}

export function AccountListingCard({ listing }: Props) {
  if (!listing) {
    return (
      <section className="overflow-hidden rounded-[var(--radius-xl)] border border-dashed border-[var(--color-outline-strong)]/40 bg-[var(--color-surface-elevated)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <p className="eyebrow text-[var(--color-accent)]">Public listing</p>
        <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
          No listing yet
        </h2>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          Create your public profile so parents can find you on Browse.
        </p>
        <Link href="/tutor/listing" className="btn-panel btn-panel-primary mt-4">
          Create listing
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-outline)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_6%,white),color-mix(in_srgb,var(--color-accent)_10%,white))] px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="eyebrow text-[var(--color-accent)]">Public listing</p>
          <h2 className="display-title mt-1 truncate text-xl text-[var(--color-primary)]">
            {listing.headline?.trim() || "Untitled listing"}
          </h2>
        </div>
        <span
          className={
            listing.published
              ? "status-pill status-pill-success"
              : "status-pill status-pill-neutral"
          }
        >
          {listing.published ? "Published" : "Draft"}
        </span>
      </div>

      <div className="space-y-3 px-5 py-4 sm:px-6">
        {listing.bio?.trim() ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
            {listing.bio}
          </p>
        ) : (
          <p className="text-sm text-[var(--color-warning)]">
            Bio missing — add it before publishing.
          </p>
        )}

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Rate
            </dt>
            <dd className="mt-0.5 font-semibold text-[var(--color-on-surface)]">
              {listing.rate_usd != null
                ? `$${listing.rate_usd.toFixed(2)} / lesson`
                : "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Reviews
            </dt>
            <dd className="mt-0.5 font-semibold text-[var(--color-on-surface)]">
              {listing.review_count && listing.rating_avg != null
                ? `${listing.rating_avg.toFixed(1)}★ · ${listing.review_count}`
                : "None yet"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Languages
            </dt>
            <dd className="mt-0.5 font-semibold text-[var(--color-on-surface)]">
              {listing.languages?.trim() || "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Experience
            </dt>
            <dd className="mt-0.5 font-semibold text-[var(--color-on-surface)]">
              {listing.years_teaching != null
                ? `${listing.years_teaching} years`
                : "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Country
            </dt>
            <dd className="mt-0.5 font-semibold text-[var(--color-on-surface)]">
              {listing.country?.trim() || "Not set"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Subjects
            </dt>
            <dd className="mt-0.5 font-semibold text-[var(--color-on-surface)]">
              {listing.subjects.length > 0
                ? subjectLabels(listing)
                : "Not set"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Ages taught
            </dt>
            <dd className="mt-0.5 font-semibold text-[var(--color-on-surface)]">
              {listing.age_bands?.length
                ? listing.age_bands.map(ageBandLabel).join(" · ")
                : "Not set"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Qualifications
            </dt>
            <dd className="mt-0.5 line-clamp-2 text-[var(--color-on-surface)]">
              {listing.qualifications?.trim() || "Not set"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Availability
            </dt>
            <dd className="mt-0.5 text-[var(--color-on-surface)]">
              {listing.availability_summary?.trim() || "Not set"}
              {listing.timezone?.trim()
                ? ` · ${timezoneLabel(listing.timezone)}`
                : ""}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/tutor/listing" className="btn-panel btn-panel-primary">
            Edit listing
          </Link>
          {listing.published ? (
            <Link
              href={`/browse/${listing.id}`}
              className="btn-panel btn-panel-secondary"
            >
              View public page
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
