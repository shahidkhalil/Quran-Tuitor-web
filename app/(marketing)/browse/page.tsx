import Link from "next/link";
import { Suspense } from "react";
import { BrowseFiltersPanel } from "@/components/listings/browse-filters";
import { BrowseResults } from "@/components/listings/browse-results";
import { BrowseResultsSkeleton } from "@/components/listings/listing-skeleton";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  browseFiltersToSearchParams,
  countActiveFilters,
  filterAndSortListings,
  parseBrowseFilters,
} from "@/domain/browse-filters";
import { getMyShortlistIds } from "@/server/actions/shortlist";
import { listPublishedListings } from "@/server/actions/tutor-listings";
import { getCurrentProfile } from "@/server/services/profile";

export const metadata = {
  title: "Browse tutors",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function BrowseResultsSection({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseBrowseFilters(searchParams);
  const qs = browseFiltersToSearchParams(filters).toString();
  const returnTo = qs ? `/browse?${qs}` : "/browse";

  const [{ listings: all }, profile] = await Promise.all([
    listPublishedListings(),
    getCurrentProfile(),
  ]);

  let shortlistedIds: string[] = [];
  if (profile?.role === "parent" || profile?.role === "adult") {
    const { ids } = await getMyShortlistIds();
    shortlistedIds = ids;
  }

  const listings = filterAndSortListings(all, filters);

  return (
    <BrowseResults
      listings={listings}
      totalPublished={all.length}
      activeFilterCount={countActiveFilters(filters)}
      shortlistedIds={shortlistedIds}
      returnTo={returnTo}
    />
  );
}

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseBrowseFilters(params);

  return (
    <MarketingShell>
      <main className="mx-auto flex w-full max-w-[1160px] flex-col gap-8 px-4 py-10 md:px-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[var(--color-accent)]">Marketplace</p>
            <h1 className="display-title mt-2 text-3xl text-[var(--color-primary)] md:text-4xl">
              Browse tutors
            </h1>
            <p className="mt-2 max-w-xl text-[var(--color-on-surface-muted)]">
              Filter verified teachers, shortlist favorites, then book a free
              trial — no card required.
            </p>
          </div>
          <Link
            href="/shortlist"
            className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-outline-strong)] bg-[var(--color-surface-elevated)] px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--color-surface-muted)]"
          >
            Shortlist & compare
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <div className="surface-card p-5 lg:sticky lg:top-24">
            <BrowseFiltersPanel
              key={browseFiltersToSearchParams(filters).toString() || "all"}
              initial={filters}
            />
          </div>
          <div className="min-w-0">
            <Suspense fallback={<BrowseResultsSkeleton />}>
              <BrowseResultsSection searchParams={params} />
            </Suspense>
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
