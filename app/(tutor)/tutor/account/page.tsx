import Link from "next/link";
import { AccountListingCard } from "@/components/account/account-listing-card";
import { AccountWorkspace } from "@/components/account/account-workspace";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { statusLabel } from "@/domain/tutor-applications";
import { getMyApplication } from "@/server/actions/tutor-applications";
import { getMyListing } from "@/server/actions/tutor-listings";
import { getCurrentProfile } from "@/server/services/profile";
import { COLLECTIONS, db } from "@/lib/firebase/db";
import { redirect } from "next/navigation";

export const metadata = { title: "Account" };

export default async function TutorAccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/tutor/account");
  if (profile.role !== "tutor" && profile.role !== "tutor_applicant") {
    redirect("/tutor");
  }

  const isVerified = profile.role === "tutor";
  const [{ listing }, { application }] = await Promise.all([
    isVerified ? getMyListing() : Promise.resolve({ listing: null }),
    getMyApplication(),
  ]);

  const profileSnap = await db()
    .collection(COLLECTIONS.profiles)
    .doc(profile.id)
    .get();
  const raw = profileSnap.data() as
    | { created_at?: string; updated_at?: string }
    | undefined;

  const details = [
    { label: "Email", value: profile.email ?? "—" },
    { label: "Account ID", value: profile.id, hint: "Used for support and payouts" },
    {
      label: "Role",
      value: isVerified ? "Verified tutor" : "Tutor applicant",
    },
    {
      label: "Application",
      value: application
        ? statusLabel(application.status)
        : isVerified
          ? "Approved"
          : "Not submitted",
      hint: application?.full_name
        ? `Name on file: ${application.full_name}`
        : undefined,
    },
    {
      label: "Payouts",
      value: profile.stripe_connect_payouts_enabled
        ? "Stripe Connect ready"
        : profile.stripe_connect_account_id
          ? "Connect started — finish setup on Earnings"
          : "Not connected yet",
      hint: "Manage from Earnings",
    },
    {
      label: "Listing",
      value: listing
        ? listing.published
          ? "Published on Browse"
          : "Draft — not public"
        : isVerified
          ? "Not created"
          : "Available after approval",
    },
    ...(raw?.created_at
      ? [
          {
            label: "Member since",
            value: new Date(raw.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
        ]
      : []),
    ...(raw?.updated_at
      ? [
          {
            label: "Profile updated",
            value: new Date(raw.updated_at).toLocaleString(),
          },
        ]
      : []),
  ];

  const shortcuts = isVerified
    ? [
        {
          href: "/tutor/listing",
          title: "Edit listing",
          body: "Photo, headline, rate, subjects",
          icon: "L",
        },
        {
          href: "/tutor/calendar",
          title: "Calendar",
          body: "Lessons, attendance, progress notes",
          icon: "C",
        },
        {
          href: "/tutor/messages",
          title: "Messages",
          body: "Parent-visible family threads",
          icon: "M",
        },
        {
          href: "/tutor/earnings",
          title: "Earnings",
          body: "Ledger balance and payouts",
          icon: "£",
        },
        {
          href: "/tutor/application",
          title: "Application",
          body: "Vetting status and history",
          icon: "A",
        },
      ]
    : [
        {
          href: "/tutor/application",
          title: "Application",
          body: "Finish or track your vetting",
          icon: "A",
        },
        {
          href: "/teach",
          title: "Teach with us",
          body: "How onboarding works",
          icon: "T",
        },
      ];

  return (
    <>
      <PanelPageHeader
        eyebrow="Settings"
        title="Your account"
        description="Account details, profile photo, and your public listing — edit listing from here."
        actions={
          isVerified ? (
            <Link href="/tutor/listing" className="btn-panel btn-panel-primary">
              Edit listing
            </Link>
          ) : (
            <Link
              href="/tutor/application"
              className="btn-panel btn-panel-secondary"
            >
              Application
            </Link>
          )
        }
      />

      <AccountWorkspace
        email={profile.email}
        photoUrl={profile.photo_url}
        roleLabel={isVerified ? "Verified tutor" : "Applicant"}
        badge={
          listing?.published
            ? "Live on Browse"
            : isVerified
              ? "Listing draft"
              : "Under review"
        }
        safetyNote="Parents always pay the platform — never request personal transfers."
        details={details}
        shortcuts={shortcuts}
        extra={
          isVerified ? <AccountListingCard listing={listing} /> : undefined
        }
      />
    </>
  );
}
