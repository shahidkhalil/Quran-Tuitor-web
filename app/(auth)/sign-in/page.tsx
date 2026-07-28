import { SignInForm } from "@/components/auth/sign-in-form";
import { homePathForRole } from "@/domain/roles";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const nextPath =
    next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  if (isAuthConfigured()) {
    const profile = await getCurrentProfile();
    if (profile) {
      redirect(nextPath ?? homePathForRole(profile.role));
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-[1120px] flex-1 flex-col px-4 py-12 md:px-8">
      <div className="mb-8 max-w-lg space-y-2">
        <p className="font-[family-name:var(--font-fraunces)] text-sm font-semibold tracking-tight text-[var(--color-primary)]">
          Quran Tutor Marketplace
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium text-[var(--color-on-background)] md:text-4xl">
          Sign in
        </h1>
        <p className="text-base text-[var(--color-on-surface-muted)]">
          Access your parent, tutor, or admin workspace.
        </p>
      </div>

      <SignInForm nextPath={nextPath} />

      <p className="mt-8 text-sm text-[var(--color-on-surface-muted)]">
        <Link
          href="/"
          className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </p>
    </main>
  );
}
