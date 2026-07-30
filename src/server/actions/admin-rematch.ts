"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PlatformPayment } from "@/domain/payments";
import {
  REMATCH_FEE_CENTS,
  type Rematch,
} from "@/domain/rematches";
import {
  LESSON_DURATION_MINUTES,
  buildLessonMeetingUrl,
  generateWeeklyOccurrences,
  type RecurringBooking,
  type ScheduledLesson,
  type Weekday,
} from "@/domain/recurring-bookings";
import type { SupportCase } from "@/domain/support-cases";
import type { TutorListing } from "@/domain/tutor-listings";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { assertTutorCanAcceptNewBookings } from "@/server/actions/admin-enforcement";
import { createInAppNotification } from "@/server/actions/notifications";
import { listPublishedListings } from "@/server/actions/tutor-listings";
import { ensureMessageThread } from "@/server/services/messages";
import { getCurrentProfile } from "@/server/services/profile";

export type RematchFormState = {
  error?: string;
  fieldErrors?: {
    toListingId?: string;
    notes?: string;
  };
};

export type RematchContext = {
  transferableLessons: number;
  paymentId: string | null;
  recurringBookingId: string | null;
  fromTutorId: string;
  fromListingId: string;
  alreadyRematched: boolean;
  rematchId: string | null;
  candidateListings: Array<{
    id: string;
    tutor_id: string;
    headline: string;
    rate_usd: number;
  }>;
};

async function requireAdmin() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { ok: false as const, error: "Admin only." };
  }
  return { ok: true as const, profile };
}

async function writeAudit(input: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  await db().collection(COLLECTIONS.auditLog).add({
    id: db().collection(COLLECTIONS.auditLog).doc().id,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    before_state: input.before,
    after_state: input.after,
    created_at: nowIso(),
  });
}

function nextFirstStartFromRecurring(recurring: RecurringBooking): string {
  const now = Date.now();
  const base = new Date(recurring.first_start);
  // Walk forward by weeks until after now
  let t = base.getTime();
  while (t <= now) {
    t += 7 * 24 * 60 * 60 * 1000;
  }
  return new Date(t).toISOString();
}

async function resolvePackageForCase(caseRow: SupportCase): Promise<{
  payment: PlatformPayment | null;
  recurring: RecurringBooking | null;
  unusedLessons: ScheduledLesson[];
}> {
  let payment: PlatformPayment | null = null;

  if (caseRow.booking_kind === "lesson") {
    const lessonSnap = await db()
      .collection(COLLECTIONS.scheduledLessons)
      .doc(caseRow.booking_id)
      .get();
    if (lessonSnap.exists) {
      const lesson = lessonSnap.data() as ScheduledLesson;
      const paySnap = await db()
        .collection(COLLECTIONS.payments)
        .doc(lesson.payment_id)
        .get();
      if (paySnap.exists) {
        payment = { ...(paySnap.data() as PlatformPayment), id: paySnap.id };
      }
    }
  } else {
    // Trial case: find paid package for same parent/learner/from-tutor if any
    const paySnap = await db()
      .collection(COLLECTIONS.payments)
      .where("parent_id", "==", caseRow.parent_id)
      .where("learner_id", "==", caseRow.learner_id)
      .where("tutor_id", "==", caseRow.tutor_id)
      .where("status", "==", "paid")
      .get();
    const paid = paySnap.docs
      .map((d) => ({ ...(d.data() as PlatformPayment), id: d.id }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    payment = paid[0] ?? null;
  }

  if (!payment) {
    return { payment: null, recurring: null, unusedLessons: [] };
  }

  let recurring: RecurringBooking | null = null;
  if (payment.recurring_booking_id) {
    const recSnap = await db()
      .collection(COLLECTIONS.recurringBookings)
      .doc(payment.recurring_booking_id)
      .get();
    if (recSnap.exists) {
      recurring = { ...(recSnap.data() as RecurringBooking), id: recSnap.id };
    }
  }

  const lessonSnap = await db()
    .collection(COLLECTIONS.scheduledLessons)
    .where("payment_id", "==", payment.id)
    .get();
  const unusedLessons = lessonSnap.docs
    .map((d) => ({ ...(d.data() as ScheduledLesson), id: d.id }))
    .filter((l) => l.status === "scheduled")
    .sort((a, b) => a.sequence - b.sequence);

  return { payment, recurring, unusedLessons };
}

export async function getRematchContextForCase(
  caseId: string,
): Promise<{ context: RematchContext | null; error?: string }> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return { context: null, error: ctx.error };

  const snap = await db().collection(COLLECTIONS.supportCases).doc(caseId).get();
  if (!snap.exists) return { context: null, error: "Case not found." };
  const caseRow = { ...(snap.data() as SupportCase), id: snap.id };

  const { payment, recurring, unusedLessons } =
    await resolvePackageForCase(caseRow);
  const { listings } = await listPublishedListings();
  const candidates = listings
    .filter((l) => l.tutor_id !== caseRow.tutor_id && l.published)
    .map((l: TutorListing) => ({
      id: l.id,
      tutor_id: l.tutor_id,
      headline: l.headline,
      rate_usd: l.rate_usd ?? 0,
    }));
  // listPublishedListings already excludes suspended/unlisted tutors

  return {
    context: {
      transferableLessons: unusedLessons.length,
      paymentId: payment?.id ?? null,
      recurringBookingId: recurring?.id ?? null,
      fromTutorId: caseRow.tutor_id,
      fromListingId: caseRow.listing_id,
      alreadyRematched: Boolean(caseRow.rematch_id),
      rematchId: caseRow.rematch_id,
      candidateListings: candidates,
    },
  };
}

export async function executeFreeRematch(
  _prev: RematchFormState,
  formData: FormData,
): Promise<RematchFormState> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return { error: ctx.error };

  const caseId = String(formData.get("caseId") ?? "").trim();
  const toListingId = String(formData.get("toListingId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!caseId) return { error: "Missing case id." };
  if (!toListingId) {
    return { fieldErrors: { toListingId: "Pick a verified tutor listing." } };
  }

  const caseSnap = await db()
    .collection(COLLECTIONS.supportCases)
    .doc(caseId)
    .get();
  if (!caseSnap.exists) return { error: "Case not found." };
  const caseRow = { ...(caseSnap.data() as SupportCase), id: caseSnap.id };

  if (caseRow.rematch_id) {
    return { error: "This case already has a rematch recorded." };
  }
  if (caseRow.status === "closed") {
    return { error: "Reopen or use an active case before rematching." };
  }

  const listingSnap = await db()
    .collection(COLLECTIONS.tutorListings)
    .doc(toListingId)
    .get();
  if (!listingSnap.exists) {
    return { fieldErrors: { toListingId: "Listing not found." } };
  }
  const toListing = listingSnap.data() as TutorListing;
  if (!toListing.published) {
    return {
      fieldErrors: { toListingId: "Only published verified tutors can receive a rematch." },
    };
  }
  if (toListing.tutor_id === caseRow.tutor_id) {
    return {
      fieldErrors: { toListingId: "Pick a different tutor than the current one." },
    };
  }

  const toGate = await assertTutorCanAcceptNewBookings(toListing.tutor_id);
  if (!toGate.ok) {
    return {
      fieldErrors: {
        toListingId: toGate.error || "That tutor cannot accept new bookings.",
      },
    };
  }

  const { payment, recurring, unusedLessons } =
    await resolvePackageForCase(caseRow);

  const stamp = nowIso();
  const rematchId = docId();
  let newRecurringId: string | null = null;
  const cancelledIds = unusedLessons.map((l) => l.id);
  const transferCount = unusedLessons.length;

  const batch = db().batch();

  // Cancel unused lessons on old package
  for (const lesson of unusedLessons) {
    batch.set(
      db().collection(COLLECTIONS.scheduledLessons).doc(lesson.id),
      { status: "cancelled", updated_at: stamp },
      { merge: true },
    );
  }

  if (recurring && recurring.status === "active") {
    batch.set(
      db().collection(COLLECTIONS.recurringBookings).doc(recurring.id),
      { status: "cancelled", updated_at: stamp },
      { merge: true },
    );
  }

  if (payment && transferCount > 0 && recurring) {
    // Keep prepaid amount/rate; reassign parties to new tutor (no extra fee).
    batch.set(
      db().collection(COLLECTIONS.payments).doc(payment.id),
      {
        tutor_id: toListing.tutor_id,
        listing_id: toListing.id,
        updated_at: stamp,
      },
      { merge: true },
    );

    const firstStart = nextFirstStartFromRecurring(recurring);
    const occurrences = generateWeeklyOccurrences(
      firstStart,
      transferCount,
      LESSON_DURATION_MINUTES,
    );
    if (occurrences.length !== transferCount) {
      return { error: "Could not build rematch lesson series." };
    }

    newRecurringId = docId();
    const newRecurring: RecurringBooking = {
      id: newRecurringId,
      payment_id: payment.id,
      parent_id: caseRow.parent_id,
      tutor_id: toListing.tutor_id,
      listing_id: toListing.id,
      learner_id: caseRow.learner_id,
      frequency: "weekly",
      weekday: recurring.weekday as Weekday,
      local_time: recurring.local_time,
      timezone: recurring.timezone,
      first_start: firstStart,
      lesson_count: transferCount,
      duration_minutes: LESSON_DURATION_MINUTES,
      status: "active",
      created_at: stamp,
      updated_at: stamp,
    };
    batch.set(
      db().collection(COLLECTIONS.recurringBookings).doc(newRecurringId),
      newRecurring,
    );

    for (const occ of occurrences) {
      const lessonId = docId();
      const lesson: ScheduledLesson = {
        id: lessonId,
        recurring_booking_id: newRecurringId,
        payment_id: payment.id,
        parent_id: caseRow.parent_id,
        tutor_id: toListing.tutor_id,
        listing_id: toListing.id,
        learner_id: caseRow.learner_id,
        sequence: occ.sequence,
        slot_start: occ.slot_start,
        slot_end: occ.slot_end,
        status: "scheduled",
        meeting_url: buildLessonMeetingUrl(lessonId),
        created_at: stamp,
        updated_at: stamp,
      };
      batch.set(
        db().collection(COLLECTIONS.scheduledLessons).doc(lessonId),
        lesson,
      );
    }

    batch.set(
      db().collection(COLLECTIONS.payments).doc(payment.id),
      {
        tutor_id: toListing.tutor_id,
        listing_id: toListing.id,
        recurring_booking_id: newRecurringId,
        lesson_count: transferCount,
        updated_at: stamp,
      },
      { merge: true },
    );
  } else if (payment && transferCount === 0 && !recurring) {
    // Paid but not scheduled yet — reassign payment so parent schedules with new tutor
    batch.set(
      db().collection(COLLECTIONS.payments).doc(payment.id),
      {
        tutor_id: toListing.tutor_id,
        listing_id: toListing.id,
        recurring_booking_id: null,
        updated_at: stamp,
      },
      { merge: true },
    );
  }

  const outcome =
    notes ||
    (transferCount > 0
      ? `Free rematch to ${toListing.headline}. ${transferCount} unused prepaid lesson(s) transferred — no extra fee.`
      : `Free rematch to ${toListing.headline}. No unused prepaid lessons to transfer. Continue on the platform — no extra rematch fee.`);

  const rematch: Rematch = {
    id: rematchId,
    support_case_id: caseId,
    payment_id: payment?.id ?? null,
    recurring_booking_id_from: recurring?.id ?? null,
    recurring_booking_id_to: newRecurringId,
    parent_id: caseRow.parent_id,
    learner_id: caseRow.learner_id,
    from_tutor_id: caseRow.tutor_id,
    from_listing_id: caseRow.listing_id,
    to_tutor_id: toListing.tutor_id,
    to_listing_id: toListing.id,
    lessons_transferred: transferCount,
    lesson_ids_cancelled: cancelledIds,
    fee_cents: REMATCH_FEE_CENTS,
    executed_by: ctx.profile.id,
    notes: notes || null,
    created_at: stamp,
  };

  batch.set(db().collection(COLLECTIONS.rematches).doc(rematchId), rematch);

  batch.set(
    db().collection(COLLECTIONS.supportCases).doc(caseId),
    {
      tutor_id: toListing.tutor_id,
      listing_id: toListing.id,
      rematch_id: rematchId,
      rematch_at: stamp,
      status: "resolved",
      outcome_note: outcome,
      resolved_at: stamp,
      last_updated_by: ctx.profile.id,
      updated_at: stamp,
    },
    { merge: true },
  );

  try {
    await batch.commit();
  } catch {
    return { error: "Could not complete rematch. Please try again." };
  }

  try {
    await ensureMessageThread({
      parentId: caseRow.parent_id,
      tutorId: toListing.tutor_id,
      learnerId: caseRow.learner_id,
      source: payment ? "paid" : "relationship",
    });
  } catch {
    // Non-fatal — rematch already committed
  }

  await writeAudit({
    actorId: ctx.profile.id,
    action: "support_case_free_rematch",
    entityType: "rematch",
    entityId: rematchId,
    before: {
      tutor_id: caseRow.tutor_id,
      listing_id: caseRow.listing_id,
      status: caseRow.status,
    },
    after: {
      to_tutor_id: toListing.tutor_id,
      to_listing_id: toListing.id,
      lessons_transferred: transferCount,
      fee_cents: 0,
      support_case_id: caseId,
    },
  });

  await createInAppNotification({
    userId: caseRow.parent_id,
    title: "Free rematch arranged",
    body: outcome,
    link: "/parent/schedule",
  });
  await createInAppNotification({
    userId: toListing.tutor_id,
    title: "New rematch learner",
    body: "A family was rematched to you at no extra fee. Check schedule and messages.",
    link: "/tutor/calendar",
  });
  if (caseRow.reporter_id !== caseRow.parent_id) {
    await createInAppNotification({
      userId: caseRow.reporter_id,
      title: "Support rematch completed",
      body: outcome,
      link:
        caseRow.reporter_role === "tutor" ? "/tutor/support" : "/parent/support",
    });
  }

  revalidatePath(`/admin/cases/${caseId}`);
  revalidatePath("/admin/cases");
  revalidatePath("/parent/support");
  revalidatePath("/parent/schedule");
  revalidatePath("/tutor/calendar");
  redirect(`/admin/cases/${caseId}?rematched=1`);
}
