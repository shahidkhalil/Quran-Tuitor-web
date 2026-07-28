import { LEDGER_CURRENCY, type LedgerEntry } from "@/domain/ledger";

export const PAYOUT_CURRENCY = LEDGER_CURRENCY;

/** Default minimum payout: $5.00 */
export const DEFAULT_PAYOUT_MIN_CENTS = 500;

export const PAYOUT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "cancelled",
] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export type PayoutRequest = {
  id: string;
  tutor_id: string;
  amount_cents: number;
  currency: typeof PAYOUT_CURRENCY;
  status: PayoutStatus;
  stripe_connect_account_id: string | null;
  stripe_transfer_id: string | null;
  failure_reason: string | null;
  mode: "stripe" | "simulate" | "manual";
  ledger_entry_id: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
};

export function resolvePayoutMinCents(
  envValue: string | undefined = process.env.PAYOUT_MIN_CENTS,
): number {
  if (envValue == null || envValue.trim() === "") return DEFAULT_PAYOUT_MIN_CENTS;
  const n = Number(envValue);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_PAYOUT_MIN_CENTS;
  return Math.round(n);
}

/** Simulate completes without Stripe transfer. Default ON unless PAYOUT_MODE=stripe. */
export function isPayoutSimulateMode(
  envValue: string | undefined = process.env.PAYOUT_MODE,
): boolean {
  const v = (envValue ?? "simulate").trim().toLowerCase();
  return v !== "stripe";
}

export function availableBalanceCents(entries: LedgerEntry[]): number {
  const sum = entries.reduce((acc, e) => acc + e.amount_cents, 0);
  return Math.max(0, sum);
}

export function payoutStatusLabel(status: PayoutStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
  }
}

export function payoutUniqueKey(payoutId: string): string {
  return `payout_${payoutId}`;
}
