import Link from "next/link";
import { TrustStrip } from "@/components/listings/trust-strip";
import { ShortlistToggle } from "@/components/listings/shortlist-toggle";
import {
  ageBandLabel,
  formatLessonRate,
  genderLabel,
  listingDisplayName,
  listingInitials,
  subjectLabel,
  timezoneLabel,
  type TutorListing,
} from "@/domain/tutor-listings";

type Props = {
  listing: TutorListing;
  shortlisted?: boolean;
  /** When parent already has a trial/package with this tutor */
  parentCta?: {
    href: string;
    label: string;
    subtitle: string;
    kind: "trial" | "paid" | "manage";
  } | null;
};

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className={
            i < full
              ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
              : "fill-none text-[var(--color-outline)]"
          }
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 21l1.1-6.5L2.6 9.8l6.5-.9L12 3Z" />
        </svg>
      ))}
    </span>
  );
}

function TutorPhoto({ listing }: { listing: TutorListing }) {
  const name = listingDisplayName(listing.headline);
  if (listing.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={listing.photo_url}
        alt={`${name} — tutor profile photo`}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(155deg,var(--color-hero-deep)_0%,var(--color-primary)_45%,#1a6b52_100%)] text-white"
      aria-hidden
    >
      <span className="display-title text-5xl tracking-wide md:text-6xl">
        {listingInitials(listing.headline)}
      </span>
      <span className="mt-3 text-xs font-semibold tracking-[0.08em] text-white/70">
        VERIFIED TUTOR
      </span>
    </div>
  );
}

export function ListingDetail({
  listing,
  shortlisted = false,
  parentCta = null,
}: Props) {
  const reviews = listing.reviews ?? [];
  const ratingAvg = listing.rating_avg;
  const reviewCount = listing.review_count ?? reviews.length;
  const embed = listing.intro_video_url
    ? youtubeEmbedUrl(listing.intro_video_url)
    : null;
  const trialHref = `/browse/${listing.id}/trial`;
  const displayName = listingDisplayName(listing.headline);
  const hasRating = ratingAvg != null && reviewCount > 0;

  const primaryHref = parentCta?.href ?? trialHref;
  const primaryLabel = parentCta?.label ?? "Book free trial";
  const primarySubtitle =
    parentCta?.subtitle ??
    (parentCta?.kind === "paid"
      ? ""
      : "1st lesson free · no card required");
  const showFreeTrialBadge = !parentCta || parentCta.kind === "trial";
  const mobileRateHint =
    parentCta?.kind === "paid"
      ? "Continue to paid package"
      : parentCta?.kind === "manage"
        ? parentCta.subtitle
        : "Free trial · $0";

  const locationLine = listing.country?.trim()
    ? `Online · ${listing.country.trim()}`
    : "Online · Quran tutor";
  const experienceBits = [
    listing.years_teaching != null
      ? `${listing.years_teaching} yr${listing.years_teaching === 1 ? "" : "s"} teaching`
      : null,
    listing.age_bands?.length
      ? listing.age_bands.map(ageBandLabel).join(", ")
      : null,
  ].filter(Boolean) as string[];

  return (
    <article className="pb-28 lg:pb-12">
      {/* Mobile photo-first hero */}
      <div className="relative lg:hidden">
        <div className="relative aspect-[4/5] max-h-[70vh] w-full overflow-hidden bg-[var(--color-surface-muted)]">
          <TutorPhoto listing={listing} />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <Link
              href="/browse"
              className="inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-[var(--color-primary)] shadow-[var(--shadow-sm)] backdrop-blur"
              aria-label="Back to browse"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <ShortlistToggle
              listingId={listing.id}
              saved={shortlisted}
              returnTo={`/browse/${listing.id}`}
              variant="icon"
            />
          </div>
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-soft)] px-3 py-1.5 text-[11px] font-bold tracking-[0.04em] text-[var(--color-on-accent)] shadow-[var(--shadow-sm)]">
            {showFreeTrialBadge
              ? "Free trial · $0"
              : parentCta?.kind === "paid"
                ? "Paid package available"
                : "Your booking"}
          </span>
        </div>

        <div className="-mt-6 rounded-t-[1.75rem] bg-[var(--color-background)] px-4 pt-6">
          <p className="text-sm font-semibold text-[var(--color-on-surface-muted)]">
            {locationLine}
          </p>
          <h1 className="display-title mt-1 text-3xl text-[var(--color-primary)]">
            {displayName}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-on-surface-muted)]">
            {hasRating ? (
              <span className="inline-flex items-center gap-1.5">
                <StarRow rating={ratingAvg} />
                <span className="font-semibold text-[var(--color-on-surface)]">
                  {ratingAvg.toFixed(1)}
                </span>
                <span>({reviewCount})</span>
              </span>
            ) : (
              <span>New on the platform</span>
            )}
            <span aria-hidden>·</span>
            <span className="font-semibold text-[var(--color-on-surface)]">
              {formatLessonRate(listing.rate_usd)}
              <span className="font-normal text-[var(--color-on-surface-muted)]">
                /lesson
              </span>
            </span>
          </div>
          {experienceBits.length > 0 ? (
            <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
              {experienceBits.join(" · ")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1160px] px-4 md:px-8">
        {/* Desktop layout */}
        <div className="hidden lg:block">
          <p className="mb-6 pt-8 text-sm">
            <Link
              href="/browse"
              className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
            >
              ← Browse tutors
            </Link>
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12 lg:pb-8 lg:pt-2">
          <div className="min-w-0 space-y-8 pt-6 lg:pt-0">
            {/* Desktop hero strip */}
            <header className="hidden gap-6 lg:flex lg:items-start">
              <div className="relative size-40 shrink-0 overflow-hidden rounded-[1.5rem] shadow-[var(--shadow-md)]">
                <TutorPhoto listing={listing} />
                <span className="absolute bottom-2 left-2 rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[10px] font-bold tracking-[0.04em] text-[var(--color-on-accent)]">
                  {showFreeTrialBadge
                    ? "Free trial · $0"
                    : parentCta?.kind === "paid"
                      ? "Paid package"
                      : "Your booking"}
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-3 pt-1">
                <p className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-[11px] font-bold tracking-[0.06em] text-[var(--color-success)]">
                  <span className="size-2 rounded-full bg-[var(--color-success)]" />
                  VERIFIED TUTOR
                </p>
                <h1 className="display-title text-4xl text-[var(--color-primary)]">
                  {displayName}
                </h1>
                <p className="text-base text-[var(--color-on-surface-muted)]">
                  {listing.headline}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--color-on-surface-muted)]">
                  {hasRating ? (
                    <span className="inline-flex items-center gap-1.5">
                      <StarRow rating={ratingAvg} />
                      <span className="font-semibold text-[var(--color-on-surface)]">
                        {ratingAvg.toFixed(1)}
                      </span>
                      <span>
                        ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                      </span>
                    </span>
                  ) : (
                    <span>New on the platform — no reviews yet</span>
                  )}
                  <span className="font-semibold text-[var(--color-on-surface)]">
                    {formatLessonRate(listing.rate_usd)}/lesson
                  </span>
                  <span>{locationLine}</span>
                  {listing.years_teaching != null ? (
                    <span>
                      {listing.years_teaching} yr
                      {listing.years_teaching === 1 ? "" : "s"} teaching
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {listing.subjects.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]"
                    >
                      {subjectLabel(s)}
                    </span>
                  ))}
                </div>
              </div>
            </header>

            {/* Mobile headline + chips */}
            <div className="space-y-3 lg:hidden">
              <p className="text-base leading-relaxed text-[var(--color-on-surface-muted)]">
                {listing.headline}
              </p>
              <div className="flex flex-wrap gap-2">
                {listing.subjects.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]"
                  >
                    {subjectLabel(s)}
                  </span>
                ))}
              </div>
              <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.06em] text-[var(--color-success)]">
                <span className="size-2 rounded-full bg-[var(--color-success)]" />
                VERIFIED TUTOR
              </p>
            </div>

            <section className="space-y-2">
              <h2 className="display-title text-xl text-[var(--color-on-background)]">
                About {displayName}
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-[var(--color-on-surface-muted)]">
                {listing.bio}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="display-title text-xl text-[var(--color-on-background)]">
                About the lessons
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="surface-card p-4">
                  <dt className="text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
                    Subjects
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {listing.subjects.map(subjectLabel).join(", ")}
                  </dd>
                </div>
                <div className="surface-card p-4">
                  <dt className="text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
                    Languages
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{listing.languages}</dd>
                </div>
                <div className="surface-card p-4">
                  <dt className="text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
                    Ages taught
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {listing.age_bands?.length
                      ? listing.age_bands.map(ageBandLabel).join(", ")
                      : "—"}
                  </dd>
                </div>
                <div className="surface-card p-4">
                  <dt className="text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
                    Experience
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {listing.years_teaching != null
                      ? `${listing.years_teaching} year${listing.years_teaching === 1 ? "" : "s"} teaching`
                      : "—"}
                  </dd>
                </div>
                <div className="surface-card p-4">
                  <dt className="text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
                    Gender
                  </dt>
                  <dd className="mt-1 text-sm font-medium capitalize">
                    {genderLabel(listing.gender) || "—"}
                  </dd>
                </div>
                <div className="surface-card p-4">
                  <dt className="text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
                    Location
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {listing.country?.trim()
                      ? `Online from ${listing.country.trim()}`
                      : "Online"}
                  </dd>
                </div>
                {listing.timezone?.trim() ? (
                  <div className="surface-card p-4 sm:col-span-2">
                    <dt className="text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
                      Timezone
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      {timezoneLabel(listing.timezone)}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {listing.qualifications?.trim() ? (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">
                    Qualifications
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
                    {listing.qualifications}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="space-y-2">
              <h2 className="display-title text-xl text-[var(--color-on-background)]">
                Availability
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-[var(--color-on-surface-muted)]">
                {listing.availability_summary}
              </p>
              {listing.timezone?.trim() ? (
                <p className="text-sm text-[var(--color-on-surface-muted)]">
                  Times typically shared in{" "}
                  <span className="font-semibold text-[var(--color-on-surface)]">
                    {timezoneLabel(listing.timezone)}
                  </span>
                  .
                </p>
              ) : null}
            </section>

            <section className="space-y-2">
              <h2 className="display-title text-xl text-[var(--color-on-background)]">
                Experience with children
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-[var(--color-on-surface-muted)]">
                {listing.child_experience_summary}
              </p>
            </section>

            {embed || listing.intro_video_url ? (
              <section className="space-y-3">
                <h2 className="display-title text-xl text-[var(--color-on-background)]">
                  {displayName}&apos;s video
                </h2>
                {embed ? (
                  <div className="aspect-video overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-[var(--color-surface-muted)] shadow-[var(--shadow-sm)]">
                    <iframe
                      title="Tutor intro video"
                      src={embed}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <a
                    href={listing.intro_video_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
                  >
                    Watch intro video
                  </a>
                )}
              </section>
            ) : null}

            <section className="space-y-4">
              <h2 className="display-title text-xl text-[var(--color-on-background)]">
                Reviews
              </h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-[var(--color-on-surface-muted)]">
                  Reviews appear after paid lessons. You can still book a free
                  trial.
                </p>
              ) : (
                <ul className="space-y-3">
                  {reviews.map((review) => (
                    <li key={review.id} className="surface-card p-4">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {review.author_display}
                        <StarRow rating={review.rating} />
                        <span className="font-normal text-[var(--color-on-surface-muted)]">
                          {review.rating.toFixed(1)}
                        </span>
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
                        {review.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Desktop sticky book card */}
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <div className="surface-card space-y-4 p-6 shadow-[var(--shadow-md)]">
              <p className="display-title text-3xl text-[var(--color-primary)]">
                {formatLessonRate(listing.rate_usd)}
                <span className="ml-1 font-sans text-sm font-normal text-[var(--color-on-surface-muted)]">
                  / lesson
                </span>
              </p>
              <p className="text-sm font-semibold text-[var(--color-success)]">
                {primarySubtitle ||
                  (showFreeTrialBadge
                    ? "1st lesson free · no card required"
                    : "Platform checkout only")}
              </p>
              <TrustStrip className="text-xs text-[var(--color-on-surface-muted)]" />
              <Link
                href={primaryHref}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-primary)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--color-primary-hover)]"
              >
                {primaryLabel}
              </Link>
              {parentCta?.kind === "paid" ? (
                <Link
                  href="/parent/bookings"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--color-outline)] bg-transparent px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] transition hover:bg-[var(--color-surface-muted)]"
                >
                  View trial booking
                </Link>
              ) : null}
              <ShortlistToggle
                listingId={listing.id}
                saved={shortlisted}
                returnTo={`/browse/${listing.id}`}
              />
              <p className="text-xs leading-relaxed text-[var(--color-on-surface-muted)]">
                {parentCta?.kind === "paid"
                  ? "Pay only through the platform — never transfer money to the tutor directly."
                  : "Pay only through the platform if you continue after the trial — never transfer money to the tutor directly."}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA — Superprof-style Contact bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-outline)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_94%,transparent)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[1160px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--color-on-surface)]">
              {formatLessonRate(listing.rate_usd)}
              <span className="font-normal text-[var(--color-on-surface-muted)]">
                /lesson
              </span>
            </p>
            <p className="truncate text-[11px] font-semibold text-[var(--color-success)]">
              {mobileRateHint}
            </p>
          </div>
          <Link
            href={primaryHref}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-primary)] shadow-[var(--shadow-md)]"
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
