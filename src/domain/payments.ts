/** Platform Payments — USD minor units (NFR9). */

export const PAYMENT_CURRENCY = "USD" as const;

/** MVP one-time package size (lessons). Recurring schedule is Story 5.2. */
export const LESSON_PACKAGE_COUNT = 4;

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "cancelled",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type PlatformPayment = {
  id: string;
  parent_id: string;
  tutor_id: string;
  listing_id: string;
  learner_id: string;
  trial_booking_id: string | null;
  status: PaymentStatus;
  /** Total charge in USD cents */
  amount_cents: number;
  currency: typeof PAYMENT_CURRENCY;
  lesson_count: number;
  /** USD cents per lesson at purchase time */
  rate_cents: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  receipt_url: string | null;
  /** Set when Story 5.2 schedule is created */
  recurring_booking_id?: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
};

export type ProviderEvent = {
  id: string;
  provider: "stripe";
  type: string;
  payment_id: string | null;
  processed_at: string;
};

/** Convert listing USD rate to package total cents. */
export function packageAmountCents(
  rateUsd: number,
  lessonCount: number = LESSON_PACKAGE_COUNT,
): number {
  const rateCents = Math.round(rateUsd * 100);
  return rateCents * lessonCount;
}

export function formatUsdCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "pending":
      return "Awaiting payment";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
  }
}
