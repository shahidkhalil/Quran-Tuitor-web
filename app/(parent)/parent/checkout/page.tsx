import Link from "next/link";
import { TrustStrip } from "@/components/listings/trust-strip";
import { StartCheckoutButton } from "@/components/payments/start-checkout-button";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { formatUsdCents } from "@/domain/payments";
import { isStripeConfigured } from "@/lib/stripe";
import {
  getCheckoutContextFromRenewal,
  getCheckoutContextFromTrial,
} from "@/server/actions/payments";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Checkout" };

type Props = {
  searchParams: Promise<{
    from_trial?: string;
    renew_payment?: string;
    cancelled?: string;
  }>;
};

export default async function ParentCheckoutPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/sign-in?next=/parent/checkout");
  }
  if (profile.role !== "parent" && profile.role !== "adult") {
    redirect("/");
  }

  const {
    from_trial: fromTrial,
    renew_payment: renewPayment,
    cancelled,
  } = await searchParams;

  const isRenewal = Boolean(renewPayment?.trim());
  const ctx = isRenewal
    ? await getCheckoutContextFromRenewal(renewPayment!)
    : fromTrial
      ? await getCheckoutContextFromTrial(fromTrial)
      : {
          trial: null,
          priorPayment: null,
          listingHeadline: null,
          rateUsd: null,
          amountCents: null,
          lessonCount: 4,
          remainingScheduled: null,
          error:
            "Open checkout from Bookings after your free trial, or renew from Home when a package is running low.",
        };

  const stripeOk = isStripeConfigured();
  const priorPayment =
    "priorPayment" in ctx ? ctx.priorPayment : null;
  const trial = "trial" in ctx ? ctx.trial : null;
  const remainingScheduled =
    "remainingScheduled" in ctx ? ctx.remainingScheduled : null;
  const ready =
    !ctx.error &&
    ctx.amountCents != null &&
    ctx.rateUsd != null &&
    (isRenewal ? priorPayment != null : trial != null);

  return (
    <div>
      <PanelPageHeader
        eyebrow="Secure payment"
        title={isRenewal ? "Renew lesson package" : "Platform checkout"}
        description="Pay for your lesson package only through the platform. Never send money directly to the tutor."
        actions={
          <Link
            href={isRenewal ? "/parent" : "/parent/bookings"}
            className="btn-panel btn-panel-secondary"
          >
            {isRenewal ? "Back to home" : "Back to bookings"}
          </Link>
        }
      />

      <div className="mb-6">
        <TrustStrip />
      </div>

      {cancelled ? (
        <p
          role="status"
          className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm"
        >
          Checkout cancelled. Nothing was charged — try again when you’re ready.
        </p>
      ) : null}

      {ctx.error ? (
        <div className="surface-card space-y-4 p-5">
          <p role="alert" className="text-sm text-[var(--color-error)]">
            {ctx.error}
          </p>
          <Link
            href={isRenewal ? "/parent" : "/parent/bookings"}
            className="btn-panel btn-panel-secondary"
          >
            {isRenewal ? "Open home" : "Open bookings"}
          </Link>
        </div>
      ) : null}

      {ready ? (
        <section className="surface-card space-y-5 p-5 md:p-6">
          <div>
            <p className="eyebrow text-[var(--color-accent)]">
              {isRenewal ? "Renewal" : "Package"}
            </p>
            <h2 className="display-title mt-1 text-2xl text-[var(--color-primary)]">
              {ctx.lessonCount}-lesson package
            </h2>
            {isRenewal && remainingScheduled != null ? (
              <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                {remainingScheduled <= 0
                  ? "No scheduled lessons left on your current package."
                  : `${remainingScheduled} lesson${remainingScheduled === 1 ? "" : "s"} left on your current package.`}
              </p>
            ) : null}
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-on-surface-muted)]">Tutor</dt>
              <dd className="font-semibold text-[var(--color-on-surface)]">
                {ctx.listingHeadline}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-on-surface-muted)]">
                Rate per lesson
              </dt>
              <dd className="font-semibold">${ctx.rateUsd!.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-on-surface-muted)]">Lessons</dt>
              <dd className="font-semibold">{ctx.lessonCount}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-[var(--color-outline)] pt-3">
              <dt className="font-semibold">Total (USD)</dt>
              <dd className="display-title text-2xl text-[var(--color-primary)]">
                {formatUsdCents(ctx.amountCents!)}
              </dd>
            </div>
          </dl>

          {!stripeOk ? (
            <p role="alert" className="text-sm text-[var(--color-error)]">
              Stripe keys are missing. Add{" "}
              <code className="text-xs">STRIPE_SECRET_KEY</code> to{" "}
              <code className="text-xs">.env.local</code>, then restart the
              server.
            </p>
          ) : isRenewal && priorPayment ? (
            <StartCheckoutButton mode="renewal" paymentId={priorPayment.id} />
          ) : trial ? (
            <StartCheckoutButton trialId={trial.id} />
          ) : null}

          <p className="text-xs text-[var(--color-on-surface-muted)]">
            After payment you’ll set a weekly schedule. Join links appear on each
            lesson in your calendar.
          </p>
        </section>
      ) : null}
    </div>
  );
}
