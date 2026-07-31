import Link from "next/link";
import { ShortlistToggle } from "@/components/listings/shortlist-toggle";
import {
  formatLessonRate,
  hasListingIntroAudio,
  hasListingIntroVideo,
  listingInitials,
  subjectLabel,
  timezoneLabel,
  type TutorListing,
} from "@/domain/tutor-listings";

export function RecommendTutorCard({
  listing,
  saved,
  returnTo = "/parent",
}: {
  listing: TutorListing;
  saved: boolean;
  returnTo?: string;
}) {
  return (
    <article className="surface-card flex flex-col overflow-hidden p-4 sm:p-5">
      <div className="flex gap-3">
        <Link
          href={`/browse/${listing.id}`}
          className="size-12 shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(145deg,var(--color-primary),#1a6b52)] text-xs font-bold text-white"
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
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.06em] text-[var(--color-success)]">
            VERIFIED
            {listing.rating_avg != null && (listing.review_count ?? 0) > 0
              ? ` · ${listing.rating_avg.toFixed(1)}★`
              : ""}
            {hasListingIntroVideo(listing) ? " · Video" : ""}
            {hasListingIntroAudio(listing) ? " · Voice" : ""}
          </p>
          <Link
            href={`/browse/${listing.id}`}
            className="display-title mt-0.5 block text-lg text-[var(--color-primary)] hover:underline"
          >
            {listing.headline}
          </Link>
          <p className="mt-1 line-clamp-2 text-xs text-[var(--color-on-surface-muted)]">
            {listing.subjects.slice(0, 3).map(subjectLabel).join(" · ")}
            {listing.languages ? ` · ${listing.languages}` : ""}
            {listing.timezone
              ? ` · ${timezoneLabel(listing.timezone)}`
              : ""}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-on-surface)]">
            {formatLessonRate(listing.rate_usd)}
            <span className="ml-1 text-xs font-normal text-[var(--color-on-surface-muted)]">
              /lesson · free trial $0
            </span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/browse/${listing.id}`}
          className="btn-panel btn-panel-primary !min-h-9 flex-1"
        >
          Book free trial
        </Link>
        <ShortlistToggle
          listingId={listing.id}
          saved={saved}
          returnTo={returnTo}
          variant="icon"
        />
      </div>
    </article>
  );
}
