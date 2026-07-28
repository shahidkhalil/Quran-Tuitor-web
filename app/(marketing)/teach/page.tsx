import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { getCurrentProfile } from "@/server/services/profile";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { beginTutorApplicationWithCurrentAccount } from "@/server/actions/tutor-applications";

export const metadata = {
  title: "Teach with us",
};

export default async function TeachPage() {
  const profile = await getCurrentProfile();
  const isApplicant =
    profile?.role === "tutor_applicant" || profile?.role === "tutor";
  const isParentLike =
    profile?.role === "parent" || profile?.role === "adult";

  return (
    <MarketingShell>
    <main className="relative mx-auto flex min-h-full w-full max-w-[1160px] flex-col px-4 py-14 md:px-8 md:py-16">
      <p className="eyebrow text-[var(--color-accent)]">For tutors</p>
      <h1 className="display-title mt-2 max-w-2xl text-4xl text-[var(--color-primary)] md:text-5xl">
        Teach with us
      </h1>
      <p className="mt-4 max-w-xl text-lg text-[var(--color-on-surface-muted)]">
        Reach families worldwide looking for vetted Quran tutors. Platform
        payments, clear commission, and weekly payouts — no chasing WhatsApp
        transfers.
      </p>

      {profile?.email ? (
        <p className="mt-4 text-sm text-[var(--color-on-surface-muted)]">
          Signed in as{" "}
          <span className="font-semibold text-[var(--color-on-surface)]">
            {profile.email}
          </span>
        </p>
      ) : null}

      <ul className="mt-8 max-w-xl space-y-3 text-base text-[var(--color-on-surface)]">
        <li>Verified listing after credential and intro review</li>
        <li>Parents book trials and paid lessons on-platform only</li>
        <li>You teach; we handle trust, rematch, and support</li>
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        {isApplicant ? (
          <Link
            href="/tutor/application"
            className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            Continue application
          </Link>
        ) : isParentLike ? (
          <>
            <p className="w-full max-w-xl text-base text-[var(--color-on-surface-muted)]">
              Apply with this same login. We’ll switch your workspace to tutor
              applicant so you can submit credentials under{" "}
              <span className="font-medium text-[var(--color-on-surface)]">
                {profile?.email}
              </span>
              .
            </p>
            <form action={beginTutorApplicationWithCurrentAccount}>
              <Button type="submit">
                Apply with this account
              </Button>
            </form>
            <Link
              href="/register?as=tutor"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-outline-strong)] px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)]"
            >
              Use a different email
            </Link>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link
              href="/register?as=tutor"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
            >
              Create tutor account
            </Link>
            <Link
              href="/sign-in?next=/tutor/application"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-outline-strong)] px-5 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)]"
            >
              Already registered? Sign in
            </Link>
          </>
        )}
      </div>

      <p className="mt-8 text-sm text-[var(--color-on-surface-muted)]">
        <Link
          href="/"
          className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </p>
    </main>
    </MarketingShell>
  );
}
