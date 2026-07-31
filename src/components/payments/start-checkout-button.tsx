"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  startCheckoutFromRenewal,
  startCheckoutFromTrial,
  type CheckoutFormState,
} from "@/server/actions/payments";

type TrialProps = {
  mode?: "trial";
  trialId: string;
  paymentId?: never;
  disabled?: boolean;
};

type RenewalProps = {
  mode: "renewal";
  paymentId: string;
  trialId?: never;
  disabled?: boolean;
};

type Props = TrialProps | RenewalProps;

const initial: CheckoutFormState = {};

export function StartCheckoutButton(props: Props) {
  const isRenewal = props.mode === "renewal";
  const [state, action, pending] = useActionState(
    isRenewal ? startCheckoutFromRenewal : startCheckoutFromTrial,
    initial,
  );

  return (
    <form action={action} className="space-y-3">
      {isRenewal ? (
        <input type="hidden" name="paymentId" value={props.paymentId} />
      ) : (
        <input type="hidden" name="trialId" value={props.trialId} />
      )}
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || props.disabled}>
        {pending
          ? "Redirecting to Stripe…"
          : isRenewal
            ? "Renew package with Stripe"
            : "Pay securely with Stripe"}
      </Button>
    </form>
  );
}
