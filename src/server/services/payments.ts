import {
  type PlatformPayment,
} from "@/domain/payments";
import { COLLECTIONS, db, nowIso } from "@/lib/firebase/db";
import { createInAppNotification } from "@/server/actions/notifications";

/**
 * Mark payment paid after verified Stripe success.
 * Idempotent when status is already paid.
 */
export async function fulfillPaidCheckoutSession(input: {
  paymentId: string;
  sessionId: string;
  paymentIntentId: string | null;
  receiptUrl: string | null;
  amountTotal: number | null;
}): Promise<{ ok: boolean; already?: boolean; payment?: PlatformPayment }> {
  const ref = db().collection(COLLECTIONS.payments).doc(input.paymentId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false };
  const payment = snap.data() as PlatformPayment;

  if (payment.status === "paid") {
    return { ok: true, already: true, payment };
  }

  const stamp = nowIso();
  const next: Partial<PlatformPayment> = {
    status: "paid",
    stripe_checkout_session_id: input.sessionId,
    stripe_payment_intent_id: input.paymentIntentId,
    receipt_url: input.receiptUrl,
    amount_cents:
      typeof input.amountTotal === "number" && input.amountTotal > 0
        ? input.amountTotal
        : payment.amount_cents,
    paid_at: stamp,
    updated_at: stamp,
  };

  await ref.set(next, { merge: true });

  await createInAppNotification({
    userId: payment.parent_id,
    title: "Payment received",
    body: "Your lesson package is paid. Next you’ll set a recurring schedule with your tutor.",
    link: `/parent/checkout/success?payment_id=${payment.id}`,
  });
  await createInAppNotification({
    userId: payment.tutor_id,
    title: "Parent purchased lessons",
    body: "A parent paid for a lesson package via the platform. Recurring schedule comes next.",
    link: "/tutor",
  });

  return {
    ok: true,
    payment: { ...payment, ...next, status: "paid" } as PlatformPayment,
  };
}
