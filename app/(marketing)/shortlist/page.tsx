import Link from "next/link";
import { ShortlistCompare } from "@/components/listings/shortlist-compare";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  addToShortlist,
  getMyShortlistIds,
  getMyShortlistListings,
} from "@/server/actions/shortlist";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Shortlist" };

type Props = {
  searchParams: Promise<{ add?: string; shortlistError?: string }>;
};

export default async function ShortlistPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  const params = await searchParams;

  if (!profile) {
    const next =
      params.add != null
        ? `/shortlist?add=${encodeURIComponent(params.add)}`
        : "/shortlist";
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  if (profile.role !== "parent" && profile.role !== "adult") {
    return (
      <MarketingShell>
        <main className="mx-auto max-w-[640px] px-4 py-16 md:px-8">
          <h1 className="display-title text-3xl text-[var(--color-primary)]">
            Shortlist
          </h1>
          <p className="mt-3 text-[var(--color-on-surface-muted)]">
            Shortlist is for parent accounts. Sign in with a parent account to
            save and compare tutors.
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            Browse tutors
          </Link>
        </main>
      </MarketingShell>
    );
  }

  if (params.add) {
    await addToShortlist(params.add);
    redirect("/shortlist");
  }

  const [{ listings }, { ids }] = await Promise.all([
    getMyShortlistListings(),
    getMyShortlistIds(),
  ]);

  return (
    <MarketingShell>
      <main className="mx-auto w-full max-w-[1160px] px-4 py-10 md:px-8 md:py-12">
        <p className="mb-4 text-sm">
          <Link
            href="/browse"
            className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            ← Browse tutors
          </Link>
        </p>
        <h1 className="display-title text-3xl text-[var(--color-primary)]">
          Shortlist & compare
        </h1>
        <p className="mt-2 max-w-xl text-[var(--color-on-surface-muted)]">
          Saved tutors stay with your account so you can compare fit before
          booking a free trial.
        </p>

        {params.shortlistError ? (
          <p
            role="alert"
            className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-error)]"
          >
            {params.shortlistError}
          </p>
        ) : null}

        <div className="mt-8">
          <ShortlistCompare
            listings={listings}
            shortlistedIds={new Set(ids)}
          />
        </div>
      </main>
    </MarketingShell>
  );
}
