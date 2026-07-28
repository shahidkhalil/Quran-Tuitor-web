import Link from "next/link";
import { ShortlistToggle } from "@/components/listings/shortlist-toggle";
import {
  formatLessonRate,
  genderLabel,
  listingInitials,
  subjectLabel,
  type TutorListing,
} from "@/domain/tutor-listings";

type Props = {
  listings: TutorListing[];
  totalPublished: number;
  activeFilterCount: number;
  shortlistedIds: string[];
  returnTo: string;
};

export function BrowseResults({
  listings,
  totalPublished,
  activeFilterCount,
  shortlistedIds,
  returnTo,
}: Props) {
  const saved = new Set(shortlistedIds);

  if (totalPublished === 0) {
    return (
      <div className="surface-card px-6 py-12 text-center">
        <p className="display-title text-2xl text-[var(--color-primary)]">
          No tutors published yet
        </p>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          Approved tutors appear here after they publish a listing.
        </p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="surface-card px-6 py-12 text-center">
        <p className="display-title text-2xl text-[var(--color-primary)]">
          No tutors match these filters
        </p>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          Try widening price, languages, or clearing some filters.
        </p>
        <Link
          href="/browse"
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          <span className="font-semibold text-[var(--color-on-surface)]">
            {listings.length}
          </span>{" "}
          tutor{listings.length === 1 ? "" : "s"}
          {activeFilterCount > 0 ? " matching your filters" : " available"}
        </p>
        <Link
          href="/shortlist"
          className="rounded-full border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-4 py-2 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] shadow-[var(--shadow-xs)] transition hover:border-[var(--color-primary)]"
        >
          Shortlist{saved.size > 0 ? ` (${saved.size})` : ""}
        </Link>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {listings.map((listing) => (
          <li key={listing.id}>
            <article className="surface-card surface-card-interactive flex h-full flex-col overflow-hidden">
              <Link
                href={`/browse/${listing.id}`}
                className="flex flex-1 flex-col p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="size-14 shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(145deg,var(--color-primary),#1a6b52)] text-sm font-bold tracking-wide text-white shadow-[var(--shadow-sm)]"
                    aria-hidden
                  >
                    {listing.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.photo_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        {listingInitials(listing.headline)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.06em] text-[var(--color-success)]">
                      <span className="size-1.5 rounded-full bg-[var(--color-success)]" />
                      VERIFIED
                      {listing.rating_avg != null &&
                      (listing.review_count ?? 0) > 0
                        ? ` · ${listing.rating_avg.toFixed(1)}★`
                        : ""}
                    </p>
                    <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-lg font-medium leading-snug text-[var(--color-primary)]">
                      {listing.headline}
                    </h2>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
                  {listing.bio}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {listing.subjects.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-on-surface)]"
                    >
                      {subjectLabel(s)}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 border-t border-[var(--color-outline)] pt-4 mt-5">
                  <div className="min-w-0">
                    <p className="inline-flex items-center rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] text-[var(--color-on-accent)]">
                      Free trial · $0
                    </p>
                    <p className="mt-1.5 text-sm text-[var(--color-on-surface-muted)]">
                      {listing.languages}
                      {listing.gender ? ` · ${genderLabel(listing.gender)}` : ""}
                      {listing.years_teaching != null
                        ? ` · ${listing.years_teaching} yrs`
                        : ""}
                      {listing.country?.trim()
                        ? ` · ${listing.country.trim()}`
                        : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-right font-[family-name:var(--font-fraunces)] text-xl font-medium text-[var(--color-primary)]">
                    {formatLessonRate(listing.rate_usd)}
                    <span className="ml-0.5 block font-sans text-xs font-normal text-[var(--color-on-surface-muted)]">
                      /lesson after trial
                    </span>
                  </p>
                </div>
              </Link>
              <div className="border-t border-[var(--color-outline)] px-5 py-3">
                <ShortlistToggle
                  listingId={listing.id}
                  saved={saved.has(listing.id)}
                  returnTo={returnTo}
                  className="w-full"
                />
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
