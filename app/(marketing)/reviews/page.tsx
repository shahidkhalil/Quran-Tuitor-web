import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { TrustStrip } from "@/components/listings/trust-strip";
import { listingInitials } from "@/domain/tutor-listings";
import { getPublicReviewShowcase } from "@/server/actions/reviews";

export const metadata = {
  title: "Reviews",
  description:
    "Parent reviews of verified Quran tutors — platform payments, free trials, and trusted teaching.",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[var(--color-accent)]" aria-label={`${rating} out of 5`}>
      {"★".repeat(Math.max(0, Math.min(5, Math.round(rating))))}
      <span className="text-[var(--color-outline-strong)]">
        {"★".repeat(Math.max(0, 5 - Math.round(rating)))}
      </span>
    </span>
  );
}

export default async function PublicReviewsPage() {
  const { showcase, error } = await getPublicReviewShowcase();

  return (
    <MarketingShell>
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-10 md:px-8 md:py-14">
        <p className="eyebrow text-[var(--color-accent)]">Social proof</p>
        <h1 className="display-title mt-2 text-3xl text-[var(--color-primary)] md:text-4xl">
          Parent reviews
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[var(--color-on-surface-muted)]">
          Real feedback after completed paid lessons. Reviews appear on tutor
          profiles and help families choose with confidence.
        </p>
        <TrustStrip className="mt-4" />

        {error ? (
          <p role="alert" className="mt-6 text-sm text-[var(--color-error)]">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="surface-card p-5">
            <p className="eyebrow text-[var(--color-accent)]">Average rating</p>
            <p className="display-title mt-1 text-3xl text-[var(--color-primary)]">
              {showcase.ratingAvg != null ? showcase.ratingAvg.toFixed(1) : "—"}
            </p>
            <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
              Across published tutors
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="eyebrow text-[var(--color-accent)]">Reviews</p>
            <p className="display-title mt-1 text-3xl text-[var(--color-primary)]">
              {showcase.reviewCount}
            </p>
            <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
              From completed paid lessons
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="eyebrow text-[var(--color-accent)]">Tutors reviewed</p>
            <p className="display-title mt-1 text-3xl text-[var(--color-primary)]">
              {showcase.tutorsWithReviews}
            </p>
            <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
              of {showcase.publishedTutorCount} published
            </p>
          </div>
        </div>

        {showcase.reviews.length === 0 ? (
          <div className="surface-card mt-8 px-5 py-14 text-center">
            <p className="display-title text-2xl text-[var(--color-primary)]">
              Reviews will appear here
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-on-surface-muted)]">
              After families complete paid lessons, ratings show on this page and
              on each tutor profile.
            </p>
            <Link href="/browse" className="btn-panel btn-panel-primary mt-5 inline-flex">
              Browse tutors
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {showcase.reviews.map((review) => (
              <li key={review.id} className="surface-card flex flex-col p-5">
                <div className="flex gap-3">
                  <Link
                    href={`/browse/${review.listing_id}`}
                    className="size-12 shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(145deg,var(--color-primary),#1a6b52)] text-xs font-bold text-white"
                  >
                    {review.listing_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.listing_photo_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        {listingInitials(review.listing_headline)}
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Stars rating={review.rating} />
                    <Link
                      href={`/browse/${review.listing_id}`}
                      className="mt-1 block truncate font-semibold text-[var(--color-primary)] hover:underline"
                    >
                      {review.listing_headline}
                    </Link>
                    <p className="text-xs text-[var(--color-on-surface-muted)]">
                      {review.author_display} ·{" "}
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
                  {review.body}
                </p>
                <Link
                  href={`/browse/${review.listing_id}`}
                  className="mt-4 text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  View tutor profile
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/browse" className="btn-panel btn-panel-primary">
            Find a tutor
          </Link>
          <Link href="/register" className="btn-panel btn-panel-secondary">
            Create account
          </Link>
        </div>
      </main>
    </MarketingShell>
  );
}
