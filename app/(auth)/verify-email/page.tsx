import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify your email",
};

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-[1120px] flex-1 flex-col px-4 py-12 md:px-8">
      <div className="max-w-lg space-y-4">
        <p className="font-[family-name:var(--font-fraunces)] text-sm font-semibold tracking-tight text-[var(--color-primary)]">
          Quran Tutor Marketplace
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium text-[var(--color-on-background)] md:text-4xl">
          Check your inbox
        </h1>
        <p className="text-base text-[var(--color-on-surface-muted)]">
          {email ? (
            <>
              We sent a verification link to{" "}
              <strong className="font-semibold text-[var(--color-on-surface)]">
                {email}
              </strong>
              . Open it to confirm your email, then sign in.
            </>
          ) : (
            <>
              We sent a verification link to your email. Open it to confirm,
              then sign in.
            </>
          )}
        </p>
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          Didn’t get it? Check spam, or wait a minute and try registering again
          if needed.
        </p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <Link
            href="/sign-in"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-xs font-semibold tracking-[0.04em] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            Go to sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            Use a different email
          </Link>
        </div>
      </div>
    </main>
  );
}
