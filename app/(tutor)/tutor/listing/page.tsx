import Link from "next/link";
import { ListingEditorForm } from "@/components/tutors/listing-editor-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { getMyListing } from "@/server/actions/tutor-listings";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Listing editor" };

type Props = {
  searchParams: Promise<{ published?: string; unpublished?: string }>;
};

export default async function TutorListingPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/sign-in?next=/tutor/listing");
  }
  if (profile.role !== "tutor") {
    redirect("/tutor/application");
  }

  const { published, unpublished } = await searchParams;
  const { listing, error } = await getMyListing();

  return (
    <div className="mx-auto max-w-3xl">
      <PanelPageHeader
        eyebrow="Marketplace"
        title="Edit listing"
        description="Your public profile for Browse — photo, story, subjects, rate, and availability."
        actions={
          listing?.published ? (
            <Link
              href={`/browse/${listing.id}`}
              className="btn-panel btn-panel-secondary"
            >
              View public page
            </Link>
          ) : (
            <Link href="/browse" className="btn-panel btn-panel-secondary">
              Browse marketplace
            </Link>
          )
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { t: "Complete", d: "Fill every required section" },
          { t: "Save draft", d: "Keep work private until ready" },
          { t: "Publish", d: "Appear in parent browse" },
        ].map((item) => (
          <div
            key={item.t}
            className="rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-4 py-3"
          >
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              {item.t}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
              {item.d}
            </p>
          </div>
        ))}
      </div>

      {published ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-success)]/30 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
        >
          Listing published. Parents can discover you on Browse tutors.
        </p>
      ) : null}
      {unpublished ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm"
        >
          Listing unpublished. It will not appear in public browse.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {error}
        </p>
      ) : (
        <ListingEditorForm listing={listing} />
      )}
    </div>
  );
}
