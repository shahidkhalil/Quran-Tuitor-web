import Link from "next/link";
import { AccountWorkspace } from "@/components/account/account-workspace";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { listLearners } from "@/server/actions/learners";
import { getCurrentProfile } from "@/server/services/profile";
import { COLLECTIONS, db } from "@/lib/firebase/db";
import { redirect } from "next/navigation";

export const metadata = { title: "Account" };

const quickLinks = [
  {
    href: "/parent/watch",
    title: "Parental Watch",
    body: "Progress, attendance, and upcoming per learner",
    icon: "W",
  },
  {
    href: "/parent/family",
    title: "Family sharing",
    body: "Invite a co-parent to view-only Watch",
    icon: "F",
  },
  {
    href: "/parent/revision",
    title: "Revision",
    body: "Homework from tutor progress notes",
    icon: "R",
  },
  {
    href: "/parent/hifz",
    title: "Hifz tracker",
    body: "Surah and ayah memorisation progress",
    icon: "H",
  },
  {
    href: "/parent/archives",
    title: "Archives",
    body: "Past lessons and closed trials",
    icon: "A",
  },
  {
    href: "/parent/learners",
    title: "Learners",
    body: "Family profiles and progress notes",
    icon: "L",
  },
  {
    href: "/shortlist",
    title: "Shortlist",
    body: "Tutors you saved to compare",
    icon: "★",
  },
  {
    href: "/parent/bookings",
    title: "Bookings",
    body: "Trials and continue to paid packages",
    icon: "B",
  },
  {
    href: "/parent/schedule",
    title: "Schedule",
    body: "Paid lessons, join links, attendance",
    icon: "S",
  },
  {
    href: "/parent/messages",
    title: "Messages",
    body: "Parent-visible threads with tutors",
    icon: "M",
  },
  {
    href: "/parent/help",
    title: "Help",
    body: "FAQs for trials, join links, rematch",
    icon: "?",
  },
  {
    href: "/parent/support",
    title: "Support",
    body: "Cases from trials or paid lessons",
    icon: "S",
  },
] as const;

export default async function ParentAccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/parent/account");

  const [{ learners }, profileSnap] = await Promise.all([
    listLearners(),
    db().collection(COLLECTIONS.profiles).doc(profile.id).get(),
  ]);
  const raw = profileSnap.data() as
    | { created_at?: string; updated_at?: string }
    | undefined;

  const details = [
    { label: "Email", value: profile.email ?? "—" },
    {
      label: "Account ID",
      value: profile.id,
      hint: "Share with support if you need help",
    },
    {
      label: "Role",
      value: profile.role === "adult" ? "Adult learner" : "Parent",
    },
    {
      label: "Learners",
      value:
        learners.length === 0
          ? "None yet"
          : `${learners.length} profile${learners.length === 1 ? "" : "s"}`,
      hint: learners.map((l) => l.display_name).join(", ") || undefined,
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

  return (
    <>
      <PanelPageHeader
        eyebrow="Settings"
        title="Your account"
        description="Full account details, profile photo, and shortcuts for your family workspace."
        actions={
          <Link href="/browse" className="btn-panel btn-panel-secondary">
            Browse tutors
          </Link>
        }
      />

      <AccountWorkspace
        email={profile.email}
        photoUrl={profile.photo_url}
        roleLabel={profile.role === "adult" ? "Adult learner" : "Parent"}
        badge="Platform payments only"
        safetyNote="Payments always go through the platform. Never transfer money directly to a tutor."
        details={details}
        shortcuts={[...quickLinks]}
      />
    </>
  );
}
