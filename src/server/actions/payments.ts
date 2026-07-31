"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  LESSON_PACKAGE_COUNT,
  PAYMENT_CURRENCY,
  packageAmountCents,
  type PlatformPayment,
} from "@/domain/payments";
import {
  packagesNeedingRenewal,
  renewalPromptCopy,
  type PackageRenewalPrompt,
} from "@/domain/package-renewal";
import type {
  RecurringBooking,
  ScheduledLesson,
} from "@/domain/recurring-bookings";
import { canShowConversionCta, type TrialBooking } from "@/domain/trials";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getAppOrigin, getStripe, isStripeConfigured } from "@/lib/stripe";
import { getPublishedListingById } from "@/server/actions/tutor-listings";
import { assertTutorCanAcceptNewBookings } from "@/server/actions/admin-enforcement";
import { fulfillPaidCheckoutSession } from "@/server/services/payments";
import { getCurrentProfile } from "@/server/services/profile";

export type CheckoutFormState = {
  error?: string;
};

async function requireParentLike() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Please sign in.", needsAuth: true as const };
  }
  if (profile.role !== "parent" && profile.role !== "adult") {
    return {
      ok: false as const,
      error: "Use a parent account to check out.",
    };
  }
  return { ok: true as const, profile };
}

export async function getCheckoutContextFromTrial(trialId: string): Promise<{
  trial: TrialBooking | null;
  listingHeadline: string | null;
  rateUsd: number | null;
  amountCents: number | null;
  lessonCount: number;
  error?: string;
}> {
  const empty = {
    trial: null,
    listingHeadline: null,
    rateUsd: null,
    amountCents: null,
    lessonCount: LESSON_PACKAGE_COUNT,
  };

  const ctx = await requireParentLike();
  if (!ctx.ok) return { ...empty, error: ctx.error };

  if (!trialId?.trim()) {
    return { ...empty, error: "Missing trial. Start from Bookings after your free trial." };
  }

  const snap = await db()
    .collection(COLLECTIONS.trialBookings)
    .doc(trialId.trim())
    .get();
  if (!snap.exists) {
    return { ...empty, error: "Trial booking not found." };
  }

  const trial = snap.data() as TrialBooking;
  if (trial.parent_id !== ctx.profile.id) {
    return { ...empty, error: "That trial is not on your account." };
  }

  if (!canShowConversionCta(trial)) {
    return {
      ...empty,
      trial,
      error:
        "Checkout opens after the trial ends (or after the tutor submits a summary).",
    };
  }

  const { listing } = await getPublishedListingById(trial.listing_id);
  // Allow checkout even if listing was unpublished after trial — use stored rate if needed
  let rateUsd = listing?.rate_usd ?? null;
  if (rateUsd == null) {
    const raw = await db()
      .collection(COLLECTIONS.tutorListings)
      .doc(trial.listing_id)
      .get();
    if (raw.exists) {
      const data = raw.data() as { rate_usd?: number | null; rate_gbp?: number | null };
      rateUsd = data.rate_usd ?? data.rate_gbp ?? null;
    }
  }

  if (rateUsd == null || rateUsd <= 0) {
    return {
      ...empty,
      trial,
      error: "This tutor has no valid lesson rate. Contact support.",
    };
  }

  const amountCents = packageAmountCents(rateUsd, LESSON_PACKAGE_COUNT);
  return {
    trial,
    listingHeadline: listing?.headline ?? "Verified tutor",
    rateUsd,
    amountCents,
    lessonCount: LESSON_PACKAGE_COUNT,
  };
}

export async function startCheckoutFromTrial(
  _prev: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const trialId = String(formData.get("trialId") ?? "").trim();

  const ctx = await requireParentLike();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect(
        `/sign-in?next=${encodeURIComponent(`/parent/checkout?from_trial=${trialId}`)}`,
      );
    }
    return { error: ctx.error };
  }

  if (!isStripeConfigured()) {
    return {
      error:
        "Stripe is not configured. Add STRIPE_SECRET_KEY (and webhook secret) to .env.local.",
    };
  }

  const checkout = await getCheckoutContextFromTrial(trialId);
  if (checkout.error || !checkout.trial || checkout.amountCents == null || checkout.rateUsd == null) {
    return { error: checkout.error ?? "Cannot start checkout." };
  }

  const trial = checkout.trial;
  const bookingGate = await assertTutorCanAcceptNewBookings(trial.tutor_id);
  if (!bookingGate.ok) {
    return { error: bookingGate.error };
  }

  const stamp = nowIso();
  const paymentId = docId();
  const rateCents = Math.round(checkout.rateUsd * 100);

  const payment: PlatformPayment = {
    id: paymentId,
    parent_id: ctx.profile.id,
    tutor_id: trial.tutor_id,
    listing_id: trial.listing_id,
    learner_id: trial.learner_id,
    trial_booking_id: trial.id,
    status: "pending",
    amount_cents: checkout.amountCents,
    currency: PAYMENT_CURRENCY,
    lesson_count: checkout.lessonCount,
    rate_cents: rateCents,
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    receipt_url: null,
    recurring_booking_id: null,
    created_at: stamp,
    updated_at: stamp,
    paid_at: null,
  };

  await db().collection(COLLECTIONS.payments).doc(paymentId).set(payment);

  const hdrs = await headers();
  const origin = getAppOrigin(hdrs.get("origin"));

  let checkoutUrl: string;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: ctx.profile.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: checkout.amountCents,
            product_data: {
              name: `${checkout.lessonCount}-lesson package`,
              description: `${checkout.listingHeadline} · $${checkout.rateUsd}/lesson · platform checkout only`,
            },
          },
        },
      ],
      success_url: `${origin}/parent/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/parent/checkout?from_trial=${encodeURIComponent(trial.id)}&cancelled=1`,
      metadata: {
        payment_id: paymentId,
        parent_id: ctx.profile.id,
        tutor_id: trial.tutor_id,
        trial_booking_id: trial.id,
        listing_id: trial.listing_id,
        learner_id: trial.learner_id,
      },
      payment_intent_data: {
        metadata: {
          payment_id: paymentId,
          parent_id: ctx.profile.id,
        },
      },
    });

    await db().collection(COLLECTIONS.payments).doc(paymentId).set(
      {
        stripe_checkout_session_id: session.id,
        updated_at: nowIso(),
      },
      { merge: true },
    );

    if (!session.url) {
      return { error: "Stripe did not return a checkout URL. Try again." };
    }
    checkoutUrl = session.url;
  } catch (err) {
    console.error("[startCheckoutFromTrial]", err);
    await db().collection(COLLECTIONS.payments).doc(paymentId).set(
      {
        status: "failed",
        updated_at: nowIso(),
      },
      { merge: true },
    );
    return {
      error: "Could not start Stripe Checkout. Check Stripe keys and try again.",
    };
  }

  revalidatePath("/parent/checkout");
  redirect(checkoutUrl);
}

export async function getPaymentByCheckoutSession(
  sessionId: string,
): Promise<{ payment: PlatformPayment | null; error?: string }> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { payment: null, error: ctx.error };
  if (!sessionId?.trim()) return { payment: null };

  try {
    const snap = await db()
      .collection(COLLECTIONS.payments)
      .where("stripe_checkout_session_id", "==", sessionId.trim())
      .limit(1)
      .get();
    if (snap.empty) return { payment: null };
    const payment = snap.docs[0].data() as PlatformPayment;
    if (payment.parent_id !== ctx.profile.id) return { payment: null };
    return { payment };
  } catch {
    return { payment: null, error: "Could not load payment." };
  }
}

export async function getPaymentById(
  id: string,
): Promise<{ payment: PlatformPayment | null; error?: string }> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { payment: null, error: ctx.error };
  const snap = await db().collection(COLLECTIONS.payments).doc(id).get();
  if (!snap.exists) return { payment: null };
  const payment = snap.data() as PlatformPayment;
  if (payment.parent_id !== ctx.profile.id) return { payment: null };
  return { payment };
}

/** Success-page fallback if webhook is slow/local. Still requires Stripe session retrieval. */
export async function syncCheckoutSessionIfNeeded(
  sessionId: string,
): Promise<{ payment: PlatformPayment | null; error?: string }> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { payment: null, error: ctx.error };

  const existing = await getPaymentByCheckoutSession(sessionId);
  if (existing.payment?.status === "paid") return existing;

  if (!isStripeConfigured()) {
    return existing.payment
      ? existing
      : { payment: null, error: "Stripe is not configured." };
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return existing;
    }

    const paymentId = session.metadata?.payment_id;
    if (!paymentId || session.metadata?.parent_id !== ctx.profile.id) {
      return { payment: null, error: "Payment does not match your account." };
    }

    let receiptUrl: string | null = null;
    const paymentIntentId: string | null =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    if (paymentIntentId) {
      try {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ["latest_charge"],
        });
        const c = intent.latest_charge;
        if (c && typeof c === "object" && "receipt_url" in c) {
          receiptUrl =
            (c as { receipt_url?: string | null }).receipt_url ?? null;
        }
      } catch {
        /* optional */
      }
    }

    await fulfillPaidCheckoutSession({
      paymentId,
      sessionId: session.id,
      paymentIntentId,
      receiptUrl,
      amountTotal: session.amount_total,
    });

    revalidatePath("/parent/bookings");
    revalidatePath("/parent/checkout");
    revalidatePath("/parent/checkout/success");

    return getPaymentById(paymentId);
  } catch (err) {
    console.error("[syncCheckoutSessionIfNeeded]", err);
    return existing.payment
      ? existing
      : { payment: null, error: "Could not confirm payment with Stripe." };
  }
}

export type ParentRenewalPromptView = PackageRenewalPrompt & {
  listingHeadline: string;
  title: string;
  body: string;
  href: string;
};

/** Packages with ≤1 remaining scheduled lesson — for home banners. */
export async function listParentPackageRenewalPrompts(): Promise<{
  prompts: ParentRenewalPromptView[];
  error?: string;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { prompts: [], error: ctx.error };

  try {
    const [paySnap, bookingSnap, lessonSnap] = await Promise.all([
      db()
        .collection(COLLECTIONS.payments)
        .where("parent_id", "==", ctx.profile.id)
        .where("status", "==", "paid")
        .get(),
      db()
        .collection(COLLECTIONS.recurringBookings)
        .where("parent_id", "==", ctx.profile.id)
        .get(),
      db()
        .collection(COLLECTIONS.scheduledLessons)
        .where("parent_id", "==", ctx.profile.id)
        .get(),
    ]);

    const bookings = bookingSnap.docs.map((d) => d.data() as RecurringBooking);
    const bookingById = new Map(bookings.map((b) => [b.id, b]));
    const lessons = lessonSnap.docs.map((d) => d.data() as ScheduledLesson);

    const packages = paySnap.docs
      .map((d) => d.data() as PlatformPayment)
      .filter((p) => p.recurring_booking_id)
      .map((p) => {
        const booking = bookingById.get(p.recurring_booking_id!);
        return {
          paymentId: p.id,
          recurringBookingId: p.recurring_booking_id!,
          listingId: p.listing_id,
          learnerId: p.learner_id,
          tutorId: p.tutor_id,
          lessonCount: booking?.lesson_count ?? p.lesson_count,
          status: booking?.status ?? "cancelled",
        };
      });

    const needing = packagesNeedingRenewal(packages, lessons);

    // Prefer one prompt per listing (most urgent remaining)
    const byListing = new Map<string, PackageRenewalPrompt>();
    for (const prompt of needing) {
      const existing = byListing.get(prompt.listingId);
      if (
        !existing ||
        prompt.remainingScheduled < existing.remainingScheduled
      ) {
        byListing.set(prompt.listingId, prompt);
      }
    }

    const prompts: ParentRenewalPromptView[] = [];
    for (const prompt of byListing.values()) {
      const { listing } = await getPublishedListingById(prompt.listingId);
      const copy = renewalPromptCopy(prompt);
      prompts.push({
        ...prompt,
        listingHeadline: listing?.headline ?? "Your tutor",
        title: `${copy.title} · ${listing?.headline ?? "Your tutor"}`,
        body: copy.body,
        href: `/parent/checkout?renew_payment=${encodeURIComponent(prompt.paymentId)}`,
      });
    }

    return {
      prompts: prompts.sort(
        (a, b) => a.remainingScheduled - b.remainingScheduled,
      ),
    };
  } catch (err) {
    console.error("[listParentPackageRenewalPrompts]", err);
    return { prompts: [], error: "Could not load package status." };
  }
}

async function resolveListingRateUsd(listingId: string): Promise<{
  rateUsd: number | null;
  headline: string;
}> {
  const { listing } = await getPublishedListingById(listingId);
  let rateUsd = listing?.rate_usd ?? null;
  let headline = listing?.headline ?? "Verified tutor";
  if (rateUsd == null) {
    const raw = await db()
      .collection(COLLECTIONS.tutorListings)
      .doc(listingId)
      .get();
    if (raw.exists) {
      const data = raw.data() as {
        rate_usd?: number | null;
        rate_gbp?: number | null;
        headline?: string;
      };
      rateUsd = data.rate_usd ?? data.rate_gbp ?? null;
      if (data.headline) headline = data.headline;
    }
  }
  return { rateUsd, headline };
}

export async function getCheckoutContextFromRenewal(paymentId: string): Promise<{
  priorPayment: PlatformPayment | null;
  listingHeadline: string | null;
  rateUsd: number | null;
  amountCents: number | null;
  lessonCount: number;
  remainingScheduled: number | null;
  error?: string;
}> {
  const empty = {
    priorPayment: null,
    listingHeadline: null,
    rateUsd: null,
    amountCents: null,
    lessonCount: LESSON_PACKAGE_COUNT,
    remainingScheduled: null as number | null,
  };

  const ctx = await requireParentLike();
  if (!ctx.ok) return { ...empty, error: ctx.error };

  if (!paymentId?.trim()) {
    return {
      ...empty,
      error: "Missing package. Open renewal from your home dashboard.",
    };
  }

  const snap = await db()
    .collection(COLLECTIONS.payments)
    .doc(paymentId.trim())
    .get();
  if (!snap.exists) {
    return { ...empty, error: "Previous payment not found." };
  }

  const prior = snap.data() as PlatformPayment;
  if (prior.parent_id !== ctx.profile.id) {
    return { ...empty, error: "That package is not on your account." };
  }
  if (prior.status !== "paid") {
    return { ...empty, error: "Only paid packages can be renewed." };
  }

  const { rateUsd, headline } = await resolveListingRateUsd(prior.listing_id);
  if (rateUsd == null || rateUsd <= 0) {
    return {
      ...empty,
      priorPayment: prior,
      error: "This tutor has no valid lesson rate. Contact support.",
    };
  }

  let remainingScheduled: number | null = null;
  if (prior.recurring_booking_id) {
    const lessonSnap = await db()
      .collection(COLLECTIONS.scheduledLessons)
      .where("recurring_booking_id", "==", prior.recurring_booking_id)
      .get();
    remainingScheduled = lessonSnap.docs.filter(
      (d) => (d.data() as ScheduledLesson).status === "scheduled",
    ).length;
  }

  const amountCents = packageAmountCents(rateUsd, LESSON_PACKAGE_COUNT);
  return {
    priorPayment: prior,
    listingHeadline: headline,
    rateUsd,
    amountCents,
    lessonCount: LESSON_PACKAGE_COUNT,
    remainingScheduled,
  };
}

export async function startCheckoutFromRenewal(
  _prev: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const paymentId = String(formData.get("paymentId") ?? "").trim();

  const ctx = await requireParentLike();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect(
        `/sign-in?next=${encodeURIComponent(`/parent/checkout?renew_payment=${paymentId}`)}`,
      );
    }
    return { error: ctx.error };
  }

  if (!isStripeConfigured()) {
    return {
      error:
        "Stripe is not configured. Add STRIPE_SECRET_KEY (and webhook secret) to .env.local.",
    };
  }

  const checkout = await getCheckoutContextFromRenewal(paymentId);
  if (
    checkout.error ||
    !checkout.priorPayment ||
    checkout.amountCents == null ||
    checkout.rateUsd == null
  ) {
    return { error: checkout.error ?? "Cannot start renewal checkout." };
  }

  const prior = checkout.priorPayment;
  const bookingGate = await assertTutorCanAcceptNewBookings(prior.tutor_id);
  if (!bookingGate.ok) {
    return { error: bookingGate.error };
  }

  const stamp = nowIso();
  const newPaymentId = docId();
  const rateCents = Math.round(checkout.rateUsd * 100);

  const payment: PlatformPayment = {
    id: newPaymentId,
    parent_id: ctx.profile.id,
    tutor_id: prior.tutor_id,
    listing_id: prior.listing_id,
    learner_id: prior.learner_id,
    trial_booking_id: prior.trial_booking_id,
    status: "pending",
    amount_cents: checkout.amountCents,
    currency: PAYMENT_CURRENCY,
    lesson_count: checkout.lessonCount,
    rate_cents: rateCents,
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    receipt_url: null,
    recurring_booking_id: null,
    created_at: stamp,
    updated_at: stamp,
    paid_at: null,
  };

  await db().collection(COLLECTIONS.payments).doc(newPaymentId).set(payment);

  const hdrs = await headers();
  const origin = getAppOrigin(hdrs.get("origin"));

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: ctx.profile.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: checkout.amountCents,
            product_data: {
              name: `${checkout.lessonCount}-lesson package renewal`,
              description: `${checkout.listingHeadline} · $${checkout.rateUsd}/lesson · platform checkout only`,
            },
          },
        },
      ],
      success_url: `${origin}/parent/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/parent/checkout?renew_payment=${encodeURIComponent(prior.id)}&cancelled=1`,
      metadata: {
        payment_id: newPaymentId,
        parent_id: ctx.profile.id,
        tutor_id: prior.tutor_id,
        trial_booking_id: prior.trial_booking_id ?? "",
        listing_id: prior.listing_id,
        learner_id: prior.learner_id,
        renew_from_payment_id: prior.id,
      },
      payment_intent_data: {
        metadata: {
          payment_id: newPaymentId,
          parent_id: ctx.profile.id,
        },
      },
    });

    await db().collection(COLLECTIONS.payments).doc(newPaymentId).set(
      {
        stripe_checkout_session_id: session.id,
        updated_at: nowIso(),
      },
      { merge: true },
    );

    if (!session.url) {
      return { error: "Stripe did not return a checkout URL. Try again." };
    }

    revalidatePath("/parent/checkout");
    revalidatePath("/parent");
    redirect(session.url);
  } catch (err) {
    console.error("[startCheckoutFromRenewal]", err);
    await db().collection(COLLECTIONS.payments).doc(newPaymentId).set(
      {
        status: "failed",
        updated_at: nowIso(),
      },
      { merge: true },
    );
    return {
      error: "Could not start Stripe Checkout. Check Stripe keys and try again.",
    };
  }
}
