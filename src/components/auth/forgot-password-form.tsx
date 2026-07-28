"use client";

import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useActionState } from "react";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  if (state.success) {
    return (
      <div className="max-w-md space-y-4">
        <p className="text-base text-[var(--color-on-surface)]">
          If an account exists for that email, we’ve sent a reset link. Check
          your inbox (and spam), then follow the link to choose a new password.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-5">
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

      {state.error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_8%,white)] px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-sm text-[var(--color-on-surface-muted)]">
        <Link
          href="/sign-in"
          className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
