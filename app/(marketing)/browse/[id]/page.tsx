import { ListingDetail } from "@/components/listings/listing-detail";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { getListingParentCta } from "@/server/actions/listing-parent-cta";
import { getMyShortlistIds } from "@/server/actions/shortlist";
import { getTrialSlotsForListing } from "@/server/actions/trials";
import { getPublishedListingById } from "@/server/actions/tutor-listings";
import { getCurrentProfile } from "@/server/services/profile";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { listing } = await getPublishedListingById(id);
  if (!listing) {
    return { title: "Tutor not found" };
  }
  return {
    title: listing.headline,
    description: listing.bio.slice(0, 160),
  };
}

export default async function PublicListingPage({ params }: Props) {
  const { id } = await params;
  const { listing } = await getPublishedListingById(id);
  if (!listing) notFound();

  const profile = await getCurrentProfile();
  let shortlisted = false;
  let parentCta = null;
  if (profile?.role === "parent" || profile?.role === "adult") {
    const [{ ids }, cta] = await Promise.all([
      getMyShortlistIds(),
      getListingParentCta(listing.id),
    ]);
    shortlisted = ids.includes(listing.id);
    parentCta = cta;
  }

  const { slots: trialSlots } = await getTrialSlotsForListing(listing.id);

  return (
    <MarketingShell>
      <main className="min-h-full">
        <ListingDetail
          listing={listing}
          shortlisted={shortlisted}
          parentCta={parentCta}
          trialSlots={trialSlots}
        />
      </main>
    </MarketingShell>
  );
}
