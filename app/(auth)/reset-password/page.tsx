import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password",
};

type Props = {
  searchParams: Promise<{ oobCode?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  if (!isAuthConfigured()) {
    redirect("/sign-in");
  }
  const { oobCode } = await searchParams;
  if (!oobCode) {
    redirect(
      "/forgot-password?error=" +
        encodeURIComponent("Open the reset link from your email first."),
    );
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-[1120px] flex-1 flex-col px-4 py-12 md:px-8">
      <div className="mb-8 max-w-lg space-y-2">
        <p className="font-[family-name:var(--font-fraunces)] text-sm font-semibold tracking-tight text-[var(--color-primary)]">
          Quran Tutor Marketplace
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium text-[var(--color-on-background)] md:text-4xl">
          Choose a new password
        </h1>
        <p className="text-base text-[var(--color-on-surface-muted)]">
          Use at least 8 characters. You’ll be signed in after saving.
        </p>
      </div>

      <ResetPasswordForm oobCode={oobCode} />

      <p className="mt-8 text-sm text-[var(--color-on-surface-muted)]">
        <Link
          href="/sign-in"
          className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
