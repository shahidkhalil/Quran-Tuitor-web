"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { LedgerEntry } from "@/domain/ledger";
import {
  availableBalanceCents,
  isPayoutSimulateMode,
  payoutStatusLabel,
  payoutUniqueKey,
  resolvePayoutMinCents,
  type PayoutRequest,
  type PayoutStatus,
} from "@/domain/payouts";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getAppOrigin, getStripe, isStripeConfigured } from "@/lib/stripe";
import { createInAppNotification } from "@/server/actions/notifications";
import { getCurrentProfile } from "@/server/services/profile";

export type PayoutActionState = {
  error?: string;
  success?: string;
};

async function requireTutor() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Please sign in.", needsAuth: true as const };
  }
  if (profile.role !== "tutor") {
    return { ok: false as const, error: "Tutor account required." };
  }
  return { ok: true as const, profile };
}

async function loadTutorLedger(tutorId: string): Promise<LedgerEntry[]> {
  const snap = await db()
    .collection(COLLECTIONS.ledgerEntries)
    .where("tutor_id", "==", tutorId)
    .get();
  return snap.docs
    .map((d) => d.data() as LedgerEntry)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function completePayoutPaid(input: {
  payout: PayoutRequest;
  transferId: string | null;
  mode: PayoutRequest["mode"];
}): Promise<void> {
  const stamp = nowIso();
  const ledgerId = payoutUniqueKey(input.payout.id);
  const entry: LedgerEntry = {
    id: ledgerId,
    tutor_id: input.payout.tutor_id,
    entry_kind: "payout",
    amount_cents: -Math.abs(input.payout.amount_cents),
    currency: "USD",
    payout_request_id: input.payout.id,
    unique_key: ledgerId,
    note: `Payout ${input.payout.id}`,
    created_at: stamp,
  };

  const batch = db().batch();
  batch.set(db().collection(COLLECTIONS.ledgerEntries).doc(ledgerId), entry);
  batch.set(
    db().collection(COLLECTIONS.payoutRequests).doc(input.payout.id),
    {
      status: "paid" satisfies PayoutStatus,
      stripe_transfer_id: input.transferId,
      ledger_entry_id: ledgerId,
      mode: input.mode,
      failure_reason: null,
      paid_at: stamp,
      updated_at: stamp,
    },
    { merge: true },
  );
  await batch.commit();
}

export async function getTutorPayoutDashboard(): Promise<{
  availableCents: number;
  minCents: number;
  connectAccountId: string | null;
  payoutsEnabled: boolean;
  simulate: boolean;
  payouts: PayoutRequest[];
  error?: string;
}> {
  const empty = {
    availableCents: 0,
    minCents: resolvePayoutMinCents(),
    connectAccountId: null as string | null,
    payoutsEnabled: false,
    simulate: isPayoutSimulateMode(),
    payouts: [] as PayoutRequest[],
  };

  const ctx = await requireTutor();
  if (!ctx.ok) return { ...empty, error: ctx.error };

  try {
    const [entries, payoutSnap] = await Promise.all([
      loadTutorLedger(ctx.profile.id),
      db()
        .collection(COLLECTIONS.payoutRequests)
        .where("tutor_id", "==", ctx.profile.id)
        .get(),
    ]);

    const payouts = payoutSnap.docs
      .map((d) => d.data() as PayoutRequest)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return {
      availableCents: availableBalanceCents(entries),
      minCents: resolvePayoutMinCents(),
      connectAccountId: ctx.profile.stripe_connect_account_id,
      payoutsEnabled: ctx.profile.stripe_connect_payouts_enabled,
      simulate: isPayoutSimulateMode(),
      payouts,
    };
  } catch {
    return { ...empty, error: "Could not load payout dashboard." };
  }
}

/** Start or resume Stripe Connect Express onboarding. */
export async function startStripeConnectOnboarding() {
  const ctx = await requireTutor();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect("/sign-in?next=/tutor/earnings");
    }
    redirect("/tutor/earnings?error=connect");
  }

  if (isPayoutSimulateMode()) {
    redirect("/tutor/earnings?error=simulate-mode");
  }

  if (!isStripeConfigured()) {
    redirect("/tutor/earnings?error=stripe");
  }

  try {
    const stripe = getStripe();
    const origin = getAppOrigin();
    const profileRef = db().collection(COLLECTIONS.profiles).doc(ctx.profile.id);
    let accountId = ctx.profile.stripe_connect_account_id;

    if (!accountId) {
      const country =
        process.env.STRIPE_CONNECT_DEFAULT_COUNTRY?.trim().toUpperCase() || "US";
      const account = await stripe.accounts.create({
        type: "express",
        country,
        email: ctx.profile.email ?? undefined,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: { tutor_id: ctx.profile.id },
      });
      accountId = account.id;
      await profileRef.set(
        {
          stripe_connect_account_id: accountId,
          stripe_connect_payouts_enabled: false,
          updated_at: nowIso(),
        },
        { merge: true },
      );
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/tutor/earnings?connect=refresh`,
      return_url: `${origin}/tutor/earnings?connect=return`,
      type: "account_onboarding",
    });

    redirect(link.url);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[startStripeConnectOnboarding]", err);
    const message = err instanceof Error ? err.message : "";
    if (
      /signed up for Connect|Connect.*dashboard\.stripe\.com\/connect/i.test(
        message,
      )
    ) {
      redirect("/tutor/earnings?error=connect-not-enabled");
    }
    redirect("/tutor/earnings?error=connect");
  }
}

/** Refresh Connect payouts_enabled after return from Stripe. */
export async function syncStripeConnectStatus(): Promise<{
  payoutsEnabled: boolean;
  error?: string;
}> {
  const ctx = await requireTutor();
  if (!ctx.ok) return { payoutsEnabled: false, error: ctx.error };
  if (!ctx.profile.stripe_connect_account_id) {
    return { payoutsEnabled: false };
  }
  if (!isStripeConfigured()) {
    return { payoutsEnabled: false, error: "Stripe is not configured." };
  }

  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(
      ctx.profile.stripe_connect_account_id,
    );
    const payoutsEnabled = Boolean(
      account.payouts_enabled && account.charges_enabled,
    );
    await db()
      .collection(COLLECTIONS.profiles)
      .doc(ctx.profile.id)
      .set(
        {
          stripe_connect_payouts_enabled: payoutsEnabled,
          updated_at: nowIso(),
        },
        { merge: true },
      );
    revalidatePath("/tutor/earnings");
    return { payoutsEnabled };
  } catch (err) {
    console.error("[syncStripeConnectStatus]", err);
    return { payoutsEnabled: false, error: "Could not refresh Connect status." };
  }
}

export async function requestTutorPayout(
  _prev: PayoutActionState,
  _formData: FormData,
): Promise<PayoutActionState> {
  const ctx = await requireTutor();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect("/sign-in?next=/tutor/earnings");
    }
    return { error: ctx.error };
  }

  const entries = await loadTutorLedger(ctx.profile.id);
  const available = availableBalanceCents(entries);
  const minCents = resolvePayoutMinCents();

  if (available < minCents) {
    return {
      error: `Available balance must be at least $${(minCents / 100).toFixed(2)} to request a payout.`,
    };
  }

  const pendingExisting = (
    await db()
      .collection(COLLECTIONS.payoutRequests)
      .where("tutor_id", "==", ctx.profile.id)
      .get()
  ).docs
    .map((d) => d.data() as PayoutRequest)
    .some((p) => p.status === "pending");
  if (pendingExisting) {
    return { error: "You already have a pending payout. Wait for it to finish." };
  }

  const simulate = isPayoutSimulateMode();
  const stamp = nowIso();
  const payoutId = docId();
  const payout: PayoutRequest = {
    id: payoutId,
    tutor_id: ctx.profile.id,
    amount_cents: available,
    currency: "USD",
    status: "pending",
    stripe_connect_account_id: ctx.profile.stripe_connect_account_id,
    stripe_transfer_id: null,
    failure_reason: null,
    mode: simulate ? "simulate" : "stripe",
    ledger_entry_id: null,
    created_at: stamp,
    updated_at: stamp,
    paid_at: null,
  };

  await db().collection(COLLECTIONS.payoutRequests).doc(payoutId).set(payout);

  if (simulate) {
    await completePayoutPaid({ payout, transferId: null, mode: "simulate" });
    await createInAppNotification({
      userId: ctx.profile.id,
      title: "Payout completed",
      body: `$${(available / 100).toFixed(2)} marked paid (simulate mode).`,
      link: "/tutor/earnings",
    });
    revalidatePath("/tutor/earnings");
    redirect("/tutor/earnings?payout=paid");
  }

  if (!isStripeConfigured()) {
    await db()
      .collection(COLLECTIONS.payoutRequests)
      .doc(payoutId)
      .set(
        {
          status: "failed",
          failure_reason: "Stripe is not configured on the server.",
          mode: "manual",
          updated_at: nowIso(),
        },
        { merge: true },
      );
    return {
      error: "Stripe is not configured. Ask support to enable payouts.",
    };
  }

  if (
    !ctx.profile.stripe_connect_account_id ||
    !ctx.profile.stripe_connect_payouts_enabled
  ) {
    await db()
      .collection(COLLECTIONS.payoutRequests)
      .doc(payoutId)
      .set(
        {
          status: "failed",
          failure_reason: "Payout method not ready. Complete Connect onboarding.",
          updated_at: nowIso(),
        },
        { merge: true },
      );
    return {
      error: "Set up your payout method with Stripe Connect first.",
    };
  }

  try {
    const stripe = getStripe();
    const transfer = await stripe.transfers.create({
      amount: available,
      currency: "usd",
      destination: ctx.profile.stripe_connect_account_id,
      metadata: {
        payout_request_id: payoutId,
        tutor_id: ctx.profile.id,
      },
    });

    await completePayoutPaid({
      payout,
      transferId: transfer.id,
      mode: "stripe",
    });

    await createInAppNotification({
      userId: ctx.profile.id,
      title: "Payout sent",
      body: `$${(available / 100).toFixed(2)} transferred to your payout account.`,
      link: "/tutor/earnings",
    });

    revalidatePath("/tutor/earnings");
    redirect("/tutor/earnings?payout=paid");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe transfer failed.";
    console.error("[requestTutorPayout]", err);
    await db()
      .collection(COLLECTIONS.payoutRequests)
      .doc(payoutId)
      .set(
        {
          status: "failed",
          failure_reason: message.slice(0, 500),
          updated_at: nowIso(),
        },
        { merge: true },
      );

    await createInAppNotification({
      userId: ctx.profile.id,
      title: "Payout failed",
      body: "We couldn’t complete your payout. Open Earnings for details and support.",
      link: "/tutor/earnings?help=payout-failed",
    });

    revalidatePath("/tutor/earnings");
    return {
      error: `Payout failed: ${message.slice(0, 180)}`,
    };
  }
}

export type AdminPayoutState = {
  error?: string;
  success?: boolean;
};

/** Admin confirms a pending/manual payout or marks failed (audited). */
export async function adminResolvePayout(
  _prev: AdminPayoutState,
  formData: FormData,
): Promise<AdminPayoutState> {
  if (!isAuthConfigured()) return { error: "Firebase is not configured." };
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return { error: "Admin only." };

  const payoutId = String(formData.get("payoutId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!payoutId) return { error: "Payout id required." };
  if (decision !== "paid" && decision !== "failed") {
    return { error: "Choose paid or failed." };
  }
  if (!reason || reason.length < 5) {
    return { error: "Provide an audit reason (5+ characters)." };
  }

  const ref = db().collection(COLLECTIONS.payoutRequests).doc(payoutId);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Payout not found." };
  const payout = snap.data() as PayoutRequest;
  if (payout.status === "paid") {
    return { error: "Payout already paid." };
  }

  const stamp = nowIso();

  if (decision === "paid") {
    await completePayoutPaid({
      payout: { ...payout, status: "pending" },
      transferId: payout.stripe_transfer_id,
      mode: "manual",
    });
  } else {
    await ref.set(
      {
        status: "failed",
        failure_reason: reason.slice(0, 500),
        updated_at: stamp,
      },
      { merge: true },
    );
  }

  await db().collection(COLLECTIONS.auditLog).add({
    id: db().collection(COLLECTIONS.auditLog).doc().id,
    actor_id: profile.id,
    action: `payout.admin_${decision}`,
    target_type: "payout_request",
    target_id: payoutId,
    meta: {
      tutor_id: payout.tutor_id,
      amount_cents: payout.amount_cents,
      reason: reason.slice(0, 500),
    },
    created_at: stamp,
  });

  await createInAppNotification({
    userId: payout.tutor_id,
    title:
      decision === "paid" ? "Payout confirmed" : "Payout update",
    body:
      decision === "paid"
        ? `Your payout of $${(payout.amount_cents / 100).toFixed(2)} was marked paid.`
        : `Payout update: ${payoutStatusLabel("failed")}. ${reason.slice(0, 120)}`,
    link: "/tutor/earnings",
  });

  revalidatePath("/tutor/earnings");
  revalidatePath("/admin/ledger");
  return { success: true };
}

export { payoutStatusLabel };
