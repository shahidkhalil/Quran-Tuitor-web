import { TRIAL_CURRENCY } from "@/domain/trials";

export const LEDGER_CURRENCY = TRIAL_CURRENCY;

/** Default platform take rate: 25% (2500 basis points). Override via PLATFORM_COMMISSION_BPS. */
export const DEFAULT_COMMISSION_BPS = 2500;

export const LEDGER_ENTRY_KINDS = [
  "trial_stipend",
  "paid_lesson_earnings",
  "admin_adjustment",
  "payout",
] as const;
export type LedgerEntryKind = (typeof LEDGER_ENTRY_KINDS)[number];

export type LedgerEntry = {
  id: string;
  tutor_id: string;
  entry_kind: LedgerEntryKind;
  /** Positive = credit to tutor; negative = debit (admin adjustment / payout). Minor units. */
  amount_cents: number;
  currency: typeof LEDGER_CURRENCY;
  /** Present for trial stipend lines */
  trial_booking_id?: string | null;
  /** Present for paid lesson earnings */
  lesson_id?: string | null;
  payment_id?: string | null;
  attendance_record_id?: string | null;
  /** Present for payout debit lines */
  payout_request_id?: string | null;
  /** Parent-facing lesson gross (tutor does not show this as their pay) */
  gross_cents?: number | null;
  commission_cents?: number | null;
  commission_bps?: number | null;
  /** Links adjustment to prior entry when Admin corrects */
  related_entry_id?: string | null;
  unique_key: string;
  note: string | null;
  created_at: string;
};

export type CommissionSplit = {
  gross_cents: number;
  commission_cents: number;
  net_cents: number;
  commission_bps: number;
};

export function resolveCommissionBps(
  envValue: string | undefined = process.env.PLATFORM_COMMISSION_BPS,
): number {
  if (envValue == null || envValue.trim() === "") return DEFAULT_COMMISSION_BPS;
  const n = Number(envValue);
  if (!Number.isFinite(n) || n < 0 || n > 10000) return DEFAULT_COMMISSION_BPS;
  return Math.round(n);
}

/**
 * Split parent-paid lesson gross into platform commission + tutor net.
 * Commission is floored; tutor gets the remainder so cents are conserved.
 */
export function splitLessonGross(
  grossCents: number,
  commissionBps: number = resolveCommissionBps(),
): CommissionSplit {
  const gross = Math.max(0, Math.floor(grossCents));
  const bps = Math.min(10000, Math.max(0, Math.floor(commissionBps)));
  const commission_cents = Math.floor((gross * bps) / 10000);
  return {
    gross_cents: gross,
    commission_cents,
    net_cents: gross - commission_cents,
    commission_bps: bps,
  };
}

export function trialStipendUniqueKey(trialBookingId: string): string {
  return `trial_stipend_${trialBookingId}`;
}

export function paidLessonEarningsUniqueKey(lessonId: string): string {
  return `paid_lesson_${lessonId}`;
}

export function formatLedgerAmount(cents: number, currency = LEDGER_CURRENCY): string {
  const amount = (Math.abs(cents) / 100).toFixed(2);
  const signed = cents < 0 ? `-$${amount}` : `$${amount}`;
  return currency === "USD" ? signed : `${cents < 0 ? "-" : ""}${amount} ${currency}`;
}

export function formatCommissionPercent(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

export function ledgerEntryKindLabel(kind: LedgerEntryKind): string {
  switch (kind) {
    case "trial_stipend":
      return "Trial stipend";
    case "paid_lesson_earnings":
      return "Paid lesson";
    case "admin_adjustment":
      return "Admin adjustment";
    case "payout":
      return "Payout";
  }
}
