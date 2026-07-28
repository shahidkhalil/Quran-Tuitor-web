"use client";

import { useActionState } from "react";
import {
  requestTutorPayout,
  startStripeConnectOnboarding,
  type PayoutActionState,
} from "@/server/actions/payouts";
import { formatLedgerAmount } from "@/domain/ledger";

const initial: PayoutActionState = {};

type Props = {
  availableCents: number;
  minCents: number;
  payoutsEnabled: boolean;
  hasConnectAccount: boolean;
  simulate: boolean;
};

export function PayoutActionsPanel({
  availableCents,
  minCents,
  payoutsEnabled,
  hasConnectAccount,
  simulate,
}: Props) {
  const [state, action, pending] = useActionState(requestTutorPayout, initial);
  const canRequest =
    availableCents >= minCents && (simulate || payoutsEnabled);

  return (
    <div className="surface-card space-y-4 p-5 sm:p-6">
      <div>
        <p className="eyebrow text-[var(--color-accent)]">Payouts</p>
        <p className="display-title mt-1 text-2xl text-[var(--color-primary)]">
          {formatLedgerAmount(availableCents)}
        </p>
        <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
          Available to withdraw · min {formatLedgerAmount(minCents)}
          {simulate ? " · simulate mode" : ""}
        </p>
      </div>

      {!simulate ? (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm">
          <p className="font-semibold text-[var(--color-on-surface)]">
            Payout method
          </p>
          <p className="mt-1 text-[var(--color-on-surface-muted)]">
            {payoutsEnabled
              ? "Stripe Connect ready — transfers go to your saved payout account."
              : hasConnectAccount
                ? "Finish Stripe Connect onboarding to enable payouts."
                : "Connect a payout account (Stripe Express) before requesting funds."}
          </p>
          {!payoutsEnabled ? (
            <form action={startStripeConnectOnboarding} className="mt-3">
              <button type="submit" className="btn-panel btn-panel-secondary">
                {hasConnectAccount
                  ? "Continue Stripe setup"
                  : "Set up payout method"}
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          Simulate mode credits payouts without Stripe. Set{" "}
          <code className="text-xs">PAYOUT_MODE=stripe</code> for live Connect
          transfers.
        </p>
      )}

      <form action={action}>
        <button
          type="submit"
          disabled={pending || !canRequest}
          className="btn-panel btn-panel-primary"
        >
          {pending
            ? "Requesting…"
            : `Request payout · ${formatLedgerAmount(availableCents)}`}
        </button>
      </form>

      {!canRequest && availableCents < minCents ? (
        <p className="text-xs text-[var(--color-on-surface-muted)]">
          Earn at least {formatLedgerAmount(minCents)} from completed lessons
          before requesting a payout.
        </p>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-[var(--color-success)]">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}
