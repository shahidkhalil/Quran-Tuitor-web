import Link from "next/link";
import { ShortlistToggle } from "@/components/listings/shortlist-toggle";
import {
  formatLessonRate,
  genderLabel,
  subjectLabel,
  type TutorListing,
} from "@/domain/tutor-listings";

type Props = {
  listings: TutorListing[];
  shortlistedIds: Set<string>;
};

export function ShortlistCompare({ listings, shortlistedIds }: Props) {
  if (listings.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-5 py-10 text-center">
        <p className="font-[family-name:var(--font-fraunces)] text-xl font-medium text-[var(--color-primary)]">
          Your shortlist is empty
        </p>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          Save tutors from Browse or a listing page to compare them here.
        </p>
        <Link
          href="/browse"
          className="mt-5 inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
        >
          Browse tutors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-[var(--color-on-surface-muted)]">
        {listings.length} saved tutor{listings.length === 1 ? "" : "s"} — compare
        side by side, then book a free trial.
      </p>

      {/* Mobile: stacked cards */}
      <ul className="space-y-6 md:hidden">
        {listings.map((listing) => (
          <li
            key={listing.id}
            className="border-t border-[var(--color-outline)] pt-5"
          >
            <CompareCard
              listing={listing}
              saved={shortlistedIds.has(listing.id)}
            />
          </li>
        ))}
      </ul>

      {/* Desktop: comparison columns */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-outline)]">
              <th className="w-36 py-3 pr-4 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
                Compare
              </th>
              {listings.map((listing) => (
                <th key={listing.id} className="min-w-[200px] px-3 py-3 align-top">
                  <Link
                    href={`/browse/${listing.id}`}
                    className="font-[family-name:var(--font-fraunces)] text-base font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {listing.headline}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow label="Rate" listings={listings}>
              {(l) =>
                l.rate_usd != null
                  ? `${formatLessonRate(l.rate_usd)}/lesson`
                  : "—"
              }
            </CompareRow>
            <CompareRow label="Gender" listings={listings}>
              {(l) => genderLabel(l.gender) || "—"}
            </CompareRow>
            <CompareRow label="Subjects" listings={listings}>
              {(l) => l.subjects.map(subjectLabel).join(", ")}
            </CompareRow>
            <CompareRow label="Languages" listings={listings}>
              {(l) => l.languages || "—"}
            </CompareRow>
            <CompareRow label="Rating" listings={listings}>
              {(l) =>
                l.rating_avg != null
                  ? `${l.rating_avg.toFixed(1)} / 5`
                  : "New"
              }
            </CompareRow>
            <CompareRow label="Availability" listings={listings}>
              {(l) => l.availability_summary || "—"}
            </CompareRow>
            <CompareRow label="Children" listings={listings}>
              {(l) => l.child_experience_summary || "—"}
            </CompareRow>
            <tr className="border-b border-[var(--color-outline)]">
              <th className="py-4 pr-4 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
                Actions
              </th>
              {listings.map((listing) => (
                <td key={listing.id} className="px-3 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/browse/${listing.id}/trial`}
                      className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                    >
                      Book free trial
                    </Link>
                    <ShortlistToggle
                      listingId={listing.id}
                      saved={shortlistedIds.has(listing.id)}
                      returnTo="/shortlist"
                      variant="link"
                    />
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareCard({
  listing,
  saved,
}: {
  listing: TutorListing;
  saved: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-[0.04em] text-[var(--color-success)]">
        Verified tutor
      </p>
      <Link
        href={`/browse/${listing.id}`}
        className="font-[family-name:var(--font-fraunces)] text-xl font-medium text-[var(--color-primary)] hover:underline"
      >
        {listing.headline}
      </Link>
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="text-xs text-[var(--color-on-surface-muted)]">Rate</dt>
          <dd>
            {listing.rate_usd != null
              ? `${formatLessonRate(listing.rate_usd)}/lesson`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-on-surface-muted)]">
            Subjects
          </dt>
          <dd>{listing.subjects.map(subjectLabel).join(", ")}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-on-surface-muted)]">
            Languages
          </dt>
          <dd>{listing.languages}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-on-surface-muted)]">
            Availability
          </dt>
          <dd className="text-[var(--color-on-surface-muted)]">
            {listing.availability_summary}
          </dd>
        </div>
      </dl>
      <div className="flex flex-col gap-2 pt-1">
        <Link
          href={`/browse/${listing.id}/trial`}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
        >
          Book free trial
        </Link>
        <ShortlistToggle
          listingId={listing.id}
          saved={saved}
          returnTo="/shortlist"
        />
      </div>
    </div>
  );
}

function CompareRow({
  label,
  listings,
  children,
}: {
  label: string;
  listings: TutorListing[];
  children: (listing: TutorListing) => string;
}) {
  return (
    <tr className="border-b border-[var(--color-outline)] align-top">
      <th className="py-3 pr-4 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
        {label}
      </th>
      {listings.map((listing) => (
        <td
          key={listing.id}
          className="px-3 py-3 text-[var(--color-on-surface-muted)]"
        >
          {children(listing)}
        </td>
      ))}
    </tr>
  );
}
