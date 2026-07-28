"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  startCheckoutFromTrial,
  type CheckoutFormState,
} from "@/server/actions/payments";

type Props = {
  trialId: string;
  disabled?: boolean;
};

const initial: CheckoutFormState = {};

export function StartCheckoutButton({ trialId, disabled }: Props) {
  const [state, action, pending] = useActionState(
    startCheckoutFromTrial,
    initial,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="trialId" value={trialId} />
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || disabled}>
        {pending ? "Redirecting to Stripe…" : "Pay securely with Stripe"}
      </Button>
    </form>
  );
}
