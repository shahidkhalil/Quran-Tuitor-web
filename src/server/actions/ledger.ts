"use server";

import { revalidatePath } from "next/cache";
import {
  paidLessonEarningsUniqueKey,
  resolveCommissionBps,
  splitLessonGross,
  trialStipendUniqueKey,
  type LedgerEntry,
} from "@/domain/ledger";
import type { PlatformPayment } from "@/domain/payments";
import type { ScheduledLesson } from "@/domain/recurring-bookings";
import {
  resolveTrialStipendCents,
  type TrialBooking,
} from "@/domain/trials";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";

/**
 * Idempotent platform stipend credit for a completed trial.
 * Doc id = unique_key so retries are no-ops.
 */
export async function creditTrialStipend(
  booking: TrialBooking,
): Promise<{ credited: boolean; amountCents: number; error?: string }> {
  const amountCents = resolveTrialStipendCents();
  if (amountCents <= 0) {
    return { credited: false, amountCents: 0 };
  }

  const uniqueKey = trialStipendUniqueKey(booking.id);
  const ref = db().collection(COLLECTIONS.ledgerEntries).doc(uniqueKey);
  const existing = await ref.get();
  if (existing.exists) {
    return { credited: false, amountCents };
  }

  const stamp = nowIso();
  const entry: LedgerEntry = {
    id: uniqueKey,
    tutor_id: booking.tutor_id,
    entry_kind: "trial_stipend",
    amount_cents: amountCents,
    currency: "USD",
    trial_booking_id: booking.id,
    unique_key: uniqueKey,
    note: `Platform stipend for free trial ${booking.id}`,
    created_at: stamp,
  };

  try {
    await ref.create(entry);
    return { credited: true, amountCents };
  } catch (err) {
    const again = await ref.get();
    if (again.exists) {
      return { credited: false, amountCents };
    }
    console.error("[creditTrialStipend]", err);
    return {
      credited: false,
      amountCents,
      error: "Could not credit trial stipend.",
    };
  }
}

/**
 * Idempotent tutor net credit after commission for a completed paid lesson.
 */
export async function creditPaidLessonEarnings(input: {
  lesson: ScheduledLesson;
  payment: PlatformPayment;
  attendanceRecordId: string;
}): Promise<{ credited: boolean; netCents: number; error?: string }> {
  const { lesson, payment, attendanceRecordId } = input;

  if (payment.tutor_id !== lesson.tutor_id) {
    return { credited: false, netCents: 0, error: "Payment/tutor mismatch." };
  }
  if (payment.status !== "paid") {
    return { credited: false, netCents: 0, error: "Payment is not paid." };
  }

  const gross = payment.rate_cents;
  if (!Number.isFinite(gross) || gross <= 0) {
    return { credited: false, netCents: 0, error: "Invalid lesson rate." };
  }

  const split = splitLessonGross(gross, resolveCommissionBps());
  if (split.net_cents <= 0) {
    return { credited: false, netCents: 0 };
  }

  const uniqueKey = paidLessonEarningsUniqueKey(lesson.id);
  const ref = db().collection(COLLECTIONS.ledgerEntries).doc(uniqueKey);
  const existing = await ref.get();
  if (existing.exists) {
    return { credited: false, netCents: split.net_cents };
  }

  const stamp = nowIso();
  const entry: LedgerEntry = {
    id: uniqueKey,
    tutor_id: lesson.tutor_id,
    entry_kind: "paid_lesson_earnings",
    amount_cents: split.net_cents,
    currency: "USD",
    lesson_id: lesson.id,
    payment_id: payment.id,
    attendance_record_id: attendanceRecordId,
    gross_cents: split.gross_cents,
    commission_cents: split.commission_cents,
    commission_bps: split.commission_bps,
    unique_key: uniqueKey,
    note: `Lesson ${lesson.sequence} net after ${split.commission_bps / 100}% commission`,
    created_at: stamp,
  };

  try {
    await ref.create(entry);
    return { credited: true, netCents: split.net_cents };
  } catch (err) {
    const again = await ref.get();
    if (again.exists) {
      return { credited: false, netCents: split.net_cents };
    }
    console.error("[creditPaidLessonEarnings]", err);
    return {
      credited: false,
      netCents: split.net_cents,
      error: "Could not credit paid lesson earnings.",
    };
  }
}

export type AdminLedgerAdjustState = {
  error?: string;
  success?: boolean;
};

/**
 * Admin-only immutable adjustment line + audit (never mutates prior entries).
 */
export async function adminAdjustLedgerEntry(
  _prev: AdminLedgerAdjustState,
  formData: FormData,
): Promise<AdminLedgerAdjustState> {
  if (!isAuthConfigured()) {
    return { error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Admin only." };
  }

  const tutorId = String(formData.get("tutorId") ?? "").trim();
  const amountRaw = String(formData.get("amountCents") ?? "").trim();
  const relatedEntryId = String(formData.get("relatedEntryId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  const amountCents = Number(amountRaw);
  if (!tutorId) return { error: "Tutor id required." };
  if (!Number.isFinite(amountCents) || amountCents === 0) {
    return { error: "Enter a non-zero amount in cents (negative to debit)." };
  }
  if (!reason || reason.length < 5) {
    return { error: "Provide a short audit reason (5+ characters)." };
  }

  if (relatedEntryId) {
    const related = await db()
      .collection(COLLECTIONS.ledgerEntries)
      .doc(relatedEntryId)
      .get();
    if (!related.exists) return { error: "Related ledger entry not found." };
    const data = related.data() as LedgerEntry;
    if (data.tutor_id !== tutorId) {
      return { error: "Related entry belongs to a different tutor." };
    }
  }

  const stamp = nowIso();
  const id = docId();
  const entry: LedgerEntry = {
    id,
    tutor_id: tutorId,
    entry_kind: "admin_adjustment",
    amount_cents: Math.trunc(amountCents),
    currency: "USD",
    related_entry_id: relatedEntryId || null,
    unique_key: `admin_adj_${id}`,
    note: reason.slice(0, 500),
    created_at: stamp,
  };

  await db().collection(COLLECTIONS.ledgerEntries).doc(id).create(entry);
  await db().collection(COLLECTIONS.auditLog).add({
    id: db().collection(COLLECTIONS.auditLog).doc().id,
    actor_id: profile.id,
    action: "ledger.admin_adjustment",
    target_type: "ledger_entry",
    target_id: id,
    meta: {
      tutor_id: tutorId,
      amount_cents: entry.amount_cents,
      related_entry_id: relatedEntryId || null,
      reason: reason.slice(0, 500),
    },
    created_at: stamp,
  });

  revalidatePath("/admin/ledger");
  revalidatePath("/tutor/earnings");

  return { success: true };
}

export async function listTutorLedger(): Promise<{
  entries: LedgerEntry[];
  error?: string;
}> {
  if (!isAuthConfigured()) {
    return { entries: [], error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { entries: [], error: "Please sign in." };
  }
  if (profile.role !== "tutor") {
    return { entries: [], error: "Only tutors can view earnings." };
  }

  try {
    const snap = await db()
      .collection(COLLECTIONS.ledgerEntries)
      .where("tutor_id", "==", profile.id)
      .orderBy("created_at", "desc")
      .get();
    return {
      entries: snap.docs.map((d) => d.data() as LedgerEntry),
    };
  } catch {
    try {
      const snap = await db()
        .collection(COLLECTIONS.ledgerEntries)
        .where("tutor_id", "==", profile.id)
        .get();
      const entries = snap.docs
        .map((d) => d.data() as LedgerEntry)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { entries };
    } catch {
      return { entries: [], error: "Could not load earnings." };
    }
  }
}
