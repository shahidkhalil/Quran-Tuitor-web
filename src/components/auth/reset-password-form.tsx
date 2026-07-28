"use client";

import {
  updatePassword,
  type ResetPasswordState,
} from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";
import { useActionState } from "react";

const initialState: ResetPasswordState = {};

type Props = {
  oobCode: string;
};

export function ResetPasswordForm({ oobCode }: Props) {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-5">
      <input type="hidden" name="oobCode" value={oobCode} />
      <PasswordInput
        id="password"
        name="password"
        label="New password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="At least 8 characters"
      />

      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Repeat password"
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
        {pending ? "Saving…" : "Update password"}
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
