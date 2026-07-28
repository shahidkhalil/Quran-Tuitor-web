"use client";

import { signUp, type SignUpState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";
import { useActionState } from "react";

const initialState: SignUpState = {};

type Props = {
  asTutor?: boolean;
};

export function RegisterForm({ asTutor = false }: Props) {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-5">
      {asTutor ? (
        <input type="hidden" name="accountType" value="tutor" />
      ) : (
        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-semibold text-[var(--color-on-surface)]">
            I am registering as
          </legend>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3">
            <input
              type="radio"
              name="accountType"
              value="parent"
              defaultChecked
              className="size-4 accent-[var(--color-primary)]"
            />
            <span className="text-base">Parent (booking for a child)</span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3">
            <input
              type="radio"
              name="accountType"
              value="adult"
              className="size-4 accent-[var(--color-primary)]"
            />
            <span className="text-base">Adult learner (for myself)</span>
          </label>
        </fieldset>
      )}

      {asTutor ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-on-surface-muted)]">
          You’re creating a <strong className="text-[var(--color-on-surface)]">tutor applicant</strong> account. After email
          verification, sign in and submit your application.
        </p>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <PasswordInput
        id="password"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="At least 8 characters"
      />

      {state.error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_8%,white)] px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? "Creating account…"
          : asTutor
            ? "Create tutor account"
            : "Create account"}
      </Button>

      <p className="text-sm text-[var(--color-on-surface-muted)]">
        Already have an account?{" "}
        <Link
          href={asTutor ? "/sign-in?next=/tutor/application" : "/sign-in"}
          className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
