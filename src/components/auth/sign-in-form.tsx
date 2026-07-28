"use client";

import { signIn, type SignInState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";
import { useActionState } from "react";

const initialState: SignInState = {};

type Props = {
  nextPath?: string;
};

export function SignInForm({ nextPath }: Props) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-5">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

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
        autoComplete="current-password"
        required
        placeholder="Your password"
      />

      <p className="-mt-2 text-right text-sm">
        <Link
          href="/forgot-password"
          className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </p>

      {state.error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_8%,white)] px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-sm text-[var(--color-on-surface-muted)]">
        New here?{" "}
        <Link
          href={nextPath?.includes("tutor") ? "/register?as=tutor" : "/register"}
          className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
