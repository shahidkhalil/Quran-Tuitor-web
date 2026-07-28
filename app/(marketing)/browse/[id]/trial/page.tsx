import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { BookTrialForm } from "@/components/trials/book-trial-form";
import { getPublishedListingById } from "@/server/actions/tutor-listings";
import {
  getTrialSlotsForListing,
  listParentLearnersForTrial,
} from "@/server/actions/trials";
import { getCurrentProfile } from "@/server/services/profile";
import { notFound } from "next/navigation";

export const metadata = { title: "Book free trial" };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BookTrialPage({ params }: Props) {
  const { id } = await params;
  const { listing } = await getPublishedListingById(id);
  if (!listing) notFound();

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/sign-in?next=${encodeURIComponent(`/browse/${id}/trial`)}`);
  }
  if (profile.role !== "parent" && profile.role !== "adult") {
    return (
      <MarketingShell>
        <main className="mx-auto max-w-[640px] px-4 py-16 md:px-8">
          <h1 className="display-title text-3xl text-[var(--color-primary)]">
            Book a free trial
          </h1>
          <p className="mt-3 text-[var(--color-on-surface-muted)]">
            Free trials are booked from a parent account. Sign in as a parent to
            continue.
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            Back to browse
          </Link>
        </main>
      </MarketingShell>
    );
  }

  const [{ learners }, { slots, availabilitySummary }] = await Promise.all([
    listParentLearnersForTrial(),
    getTrialSlotsForListing(id),
  ]);

  return (
    <MarketingShell>
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-10 md:px-8 md:py-12">
        <p className="text-sm">
          <Link
            href={`/browse/${listing.id}`}
            className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            ← Back to listing
          </Link>
        </p>
        <div className="surface-card p-6 md:p-8">
          <h1 className="display-title text-3xl text-[var(--color-primary)]">
            Book a free trial
          </h1>
          <p className="mt-2 text-[var(--color-on-surface-muted)]">
            With{" "}
            <span className="font-medium text-[var(--color-on-surface)]">
              {listing.headline}
            </span>
            . Pick a learner and slot — no card required.
          </p>
          <div className="mt-6">
            <BookTrialForm
              listingId={listing.id}
              listingHeadline={listing.headline}
              availabilitySummary={availabilitySummary}
              learners={learners}
              slots={slots}
            />
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
