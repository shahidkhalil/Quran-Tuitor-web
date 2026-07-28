import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account",
};

type Props = {
  searchParams: Promise<{ as?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { as } = await searchParams;
  const asTutor = as === "tutor";

  return (
    <main className="mx-auto flex min-h-full w-full max-w-[1120px] flex-1 flex-col px-4 py-12 md:px-8">
      <div className="mb-8 max-w-lg space-y-2">
        <p className="font-[family-name:var(--font-fraunces)] text-sm font-semibold tracking-tight text-[var(--color-primary)]">
          Quran Tutor Marketplace
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium text-[var(--color-on-background)] md:text-4xl">
          {asTutor ? "Create a tutor account" : "Create your account"}
        </h1>
        <p className="text-base text-[var(--color-on-surface-muted)]">
          {asTutor
            ? "Register as a tutor applicant. We’ll email a verification link, then you can submit your application."
            : "Register with email. We’ll send a verification link before you continue."}
        </p>
      </div>

      <RegisterForm asTutor={asTutor} />

      <p className="mt-8 text-sm text-[var(--color-on-surface-muted)]">
        <Link
          href={asTutor ? "/teach" : "/"}
          className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          {asTutor ? "Back to Teach with us" : "Back to home"}
        </Link>
      </p>
    </main>
  );
}
