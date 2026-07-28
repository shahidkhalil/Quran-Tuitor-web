import Link from "next/link";
import { TrustStrip } from "@/components/listings/trust-strip";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  formatUsdCents,
  paymentStatusLabel,
} from "@/domain/payments";
import {
  getPaymentById,
  syncCheckoutSessionIfNeeded,
} from "@/server/actions/payments";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Payment success" };

type Props = {
  searchParams: Promise<{ session_id?: string; payment_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/sign-in?next=/parent/checkout/success");
  }
  if (profile.role !== "parent" && profile.role !== "adult") {
    redirect("/");
  }

  const { session_id: sessionId, payment_id: paymentId } = await searchParams;

  let payment =
    (sessionId
      ? (await syncCheckoutSessionIfNeeded(sessionId)).payment
      : null) ??
    (paymentId ? (await getPaymentById(paymentId)).payment : null);

  if (!payment && sessionId) {
    const synced = await syncCheckoutSessionIfNeeded(sessionId);
    payment = synced.payment;
  }

  const paid = payment?.status === "paid";

  return (
    <div>
      <PanelPageHeader
        eyebrow="Checkout"
        title={paid ? "Payment successful" : "Payment status"}
        description={
          paid
            ? "Your package is paid through the platform. Next, lock in a weekly time with your tutor."
            : "We’re confirming your payment. Refresh if you just completed Stripe checkout."
        }
      />

      <div className="mb-6">
        <TrustStrip />
      </div>

      {!payment ? (
        <div className="surface-card space-y-4 p-5">
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            We couldn’t find this payment yet. If you just paid, wait a moment
            and refresh — or open Bookings.
          </p>
          <Link href="/parent/bookings" className="btn-panel btn-panel-secondary">
            Back to bookings
          </Link>
        </div>
      ) : (
        <section className="surface-card space-y-4 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                paid
                  ? "status-pill status-pill-success"
                  : "status-pill status-pill-warning"
              }
            >
              {paymentStatusLabel(payment.status)}
            </span>
            <span className="status-pill status-pill-accent">
              {payment.lesson_count}-lesson package
            </span>
          </div>
          <p className="display-title text-3xl text-[var(--color-primary)]">
            {formatUsdCents(payment.amount_cents)}
          </p>
          {payment.receipt_url ? (
            <a
              href={payment.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-panel btn-panel-secondary"
            >
              View receipt
            </a>
          ) : paid ? (
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              Receipt will also arrive by email from Stripe when available.
            </p>
          ) : null}

          {paid ? (
            <div className="border-t border-[var(--color-outline)] pt-4">
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                Choose a weekday and time so weekly lessons appear on your
                schedule.
              </p>
              <Link
                href={`/parent/schedule?payment_id=${encodeURIComponent(payment.id)}`}
                className="btn-panel btn-panel-primary mt-4"
              >
                Set weekly schedule
              </Link>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
