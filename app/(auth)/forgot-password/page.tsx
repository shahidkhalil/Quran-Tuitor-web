import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-[1120px] flex-1 flex-col px-4 py-12 md:px-8">
      <div className="mb-8 max-w-lg space-y-2">
        <p className="font-[family-name:var(--font-fraunces)] text-sm font-semibold tracking-tight text-[var(--color-primary)]">
          Quran Tutor Marketplace
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium text-[var(--color-on-background)] md:text-4xl">
          Forgot password
        </h1>
        <p className="text-base text-[var(--color-on-surface-muted)]">
          Enter your email and we’ll send a link to set a new password.
        </p>
      </div>

      <ForgotPasswordForm />

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
