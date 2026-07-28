"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PlatformPayment } from "@/domain/payments";
import {
  LESSON_DURATION_MINUTES,
  anyRangeConflicts,
  buildLessonMeetingUrl,
  generateWeeklyOccurrences,
  parseLocalTime,
  type RecurringBooking,
  type ScheduledLesson,
  type TimeRange,
  type Weekday,
} from "@/domain/recurring-bookings";
import type { TrialBooking } from "@/domain/trials";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getPublishedListingById } from "@/server/actions/tutor-listings";
import { createInAppNotification } from "@/server/actions/notifications";
import { ensureThreadOnRelationship } from "@/server/actions/messages";
import { getCurrentProfile } from "@/server/services/profile";

export type ScheduleFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"weekday" | "localTime" | "firstStart", string>>;
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
    return { ok: false as const, error: "Use a parent account to schedule." };
  }
  return { ok: true as const, profile };
}

/** Backfill Jitsi URLs for lessons created before Story 5.3. */
async function ensureLessonMeetingUrls(
  lessons: ScheduledLesson[],
): Promise<ScheduledLesson[]> {
  const stamp = nowIso();
  const out: ScheduledLesson[] = [];

  for (const lesson of lessons) {
    if (lesson.meeting_url) {
      out.push(lesson);
      continue;
    }
    const meeting_url = buildLessonMeetingUrl(lesson.id);
    await db()
      .collection(COLLECTIONS.scheduledLessons)
      .doc(lesson.id)
      .set({ meeting_url, updated_at: stamp }, { merge: true });
    out.push({ ...lesson, meeting_url, updated_at: stamp });
  }

  return out;
}

async function tutorBusyRanges(
  tutorId: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<TimeRange[]> {
  const ranges: TimeRange[] = [];

  const lessonsSnap = await db()
    .collection(COLLECTIONS.scheduledLessons)
    .where("tutor_id", "==", tutorId)
    .where("status", "==", "scheduled")
    .get();

  for (const doc of lessonsSnap.docs) {
    const lesson = doc.data() as ScheduledLesson;
    const start = new Date(lesson.slot_start);
    if (start < windowStart || start > windowEnd) continue;
    ranges.push({ start: lesson.slot_start, end: lesson.slot_end });
  }

  const trialsSnap = await db()
    .collection(COLLECTIONS.trialBookings)
    .where("tutor_id", "==", tutorId)
    .get();

  for (const doc of trialsSnap.docs) {
    const trial = doc.data() as TrialBooking;
    if (trial.status !== "pending_tutor" && trial.status !== "accepted") continue;
    const start = new Date(trial.slot_start);
    if (start < windowStart || start > windowEnd) continue;
    ranges.push({ start: trial.slot_start, end: trial.slot_end });
  }

  return ranges;
}

export async function getScheduleContextFromPayment(paymentId: string): Promise<{
  payment: PlatformPayment | null;
  listingHeadline: string | null;
  learnerName: string | null;
  existingBooking: RecurringBooking | null;
  existingLessons: ScheduledLesson[];
  error?: string;
}> {
  const empty = {
    payment: null,
    listingHeadline: null,
    learnerName: null,
    existingBooking: null,
    existingLessons: [] as ScheduledLesson[],
  };

  const ctx = await requireParentLike();
  if (!ctx.ok) return { ...empty, error: ctx.error };

  if (!paymentId?.trim()) {
    return {
      ...empty,
      error: "Missing payment. Continue from checkout success after paying.",
    };
  }

  const paySnap = await db()
    .collection(COLLECTIONS.payments)
    .doc(paymentId.trim())
    .get();
  if (!paySnap.exists) {
    return { ...empty, error: "Payment not found." };
  }

  const payment = paySnap.data() as PlatformPayment;
  if (payment.parent_id !== ctx.profile.id) {
    return { ...empty, error: "That payment is not on your account." };
  }
  if (payment.status !== "paid") {
    return {
      ...empty,
      payment,
      error: "Schedule opens after payment succeeds.",
    };
  }

  const { listing } = await getPublishedListingById(payment.listing_id);
  let listingHeadline = listing?.headline ?? null;
  if (!listingHeadline) {
    const raw = await db()
      .collection(COLLECTIONS.tutorListings)
      .doc(payment.listing_id)
      .get();
    listingHeadline =
      (raw.data() as { headline?: string } | undefined)?.headline ??
      "Verified tutor";
  }

  let learnerName: string | null = null;
  const learnerSnap = await db()
    .collection(COLLECTIONS.learnerProfiles)
    .doc(payment.learner_id)
    .get();
  if (learnerSnap.exists) {
    learnerName =
      (learnerSnap.data() as { display_name?: string }).display_name ?? null;
  }

  let existingBooking: RecurringBooking | null = null;
  if (payment.recurring_booking_id) {
    const rb = await db()
      .collection(COLLECTIONS.recurringBookings)
      .doc(payment.recurring_booking_id)
      .get();
    if (rb.exists) existingBooking = rb.data() as RecurringBooking;
  } else {
    const byPay = await db()
      .collection(COLLECTIONS.recurringBookings)
      .where("payment_id", "==", payment.id)
      .limit(1)
      .get();
    if (!byPay.empty) {
      existingBooking = byPay.docs[0]!.data() as RecurringBooking;
    }
  }

  let existingLessons: ScheduledLesson[] = [];
  if (existingBooking) {
    const lessonsSnap = await db()
      .collection(COLLECTIONS.scheduledLessons)
      .where("recurring_booking_id", "==", existingBooking.id)
      .get();
    existingLessons = await ensureLessonMeetingUrls(
      lessonsSnap.docs
        .map((d) => d.data() as ScheduledLesson)
        .sort(
          (a, b) =>
            new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime(),
        ),
    );
  }

  return {
    payment,
    listingHeadline,
    learnerName,
    existingBooking,
    existingLessons,
  };
}

export async function createRecurringBooking(
  _prev: ScheduleFormState,
  formData: FormData,
): Promise<ScheduleFormState> {
  const paymentId = String(formData.get("paymentId") ?? "").trim();
  const weekdayRaw = Number(formData.get("weekday"));
  const localTime = String(formData.get("localTime") ?? "").trim();
  const firstStart = String(formData.get("firstStart") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim() || "UTC";

  const ctx = await requireParentLike();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect(
        `/sign-in?next=${encodeURIComponent(`/parent/schedule?payment_id=${paymentId}`)}`,
      );
    }
    return { error: ctx.error };
  }

  const fieldErrors: ScheduleFormState["fieldErrors"] = {};
  if (!Number.isInteger(weekdayRaw) || weekdayRaw < 0 || weekdayRaw > 6) {
    fieldErrors.weekday = "Pick a weekday.";
  }
  const parsedTime = parseLocalTime(localTime);
  if (!parsedTime) fieldErrors.localTime = "Pick a lesson time.";
  if (!firstStart || Number.isNaN(new Date(firstStart).getTime())) {
    fieldErrors.firstStart = "Could not compute the first lesson time.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Check the schedule fields." };
  }

  const schedule = await getScheduleContextFromPayment(paymentId);
  if (schedule.error || !schedule.payment) {
    return { error: schedule.error ?? "Cannot schedule this payment." };
  }
  if (schedule.existingBooking) {
    return {
      error: "This payment already has a recurring schedule.",
    };
  }

  const payment = schedule.payment;
  const occurrences = generateWeeklyOccurrences(
    firstStart,
    payment.lesson_count,
    LESSON_DURATION_MINUTES,
  );
  if (occurrences.length !== payment.lesson_count) {
    return { error: "Could not build the lesson series. Try another time." };
  }

  const windowStart = new Date(occurrences[0]!.slot_start);
  windowStart.setUTCDate(windowStart.getUTCDate() - 1);
  const windowEnd = new Date(occurrences[occurrences.length - 1]!.slot_end);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + 1);

  const busy = await tutorBusyRanges(payment.tutor_id, windowStart, windowEnd);
  for (const occ of occurrences) {
    if (
      anyRangeConflicts(
        { start: occ.slot_start, end: occ.slot_end },
        busy,
      )
    ) {
      return {
        error:
          "That slot conflicts with an existing tutor booking. Pick another weekday or time.",
      };
    }
  }

  const stamp = nowIso();
  const recurringId = docId();
  const recurring: RecurringBooking = {
    id: recurringId,
    payment_id: payment.id,
    parent_id: payment.parent_id,
    tutor_id: payment.tutor_id,
    listing_id: payment.listing_id,
    learner_id: payment.learner_id,
    frequency: "weekly",
    weekday: weekdayRaw as Weekday,
    local_time: localTime,
    timezone,
    first_start: firstStart,
    lesson_count: payment.lesson_count,
    duration_minutes: LESSON_DURATION_MINUTES,
    status: "active",
    created_at: stamp,
    updated_at: stamp,
  };

  const batch = db().batch();
  batch.set(
    db().collection(COLLECTIONS.recurringBookings).doc(recurringId),
    recurring,
  );

  for (const occ of occurrences) {
    const lessonId = docId();
    const lesson: ScheduledLesson = {
      id: lessonId,
      recurring_booking_id: recurringId,
      payment_id: payment.id,
      parent_id: payment.parent_id,
      tutor_id: payment.tutor_id,
      listing_id: payment.listing_id,
      learner_id: payment.learner_id,
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
      recurring_booking_id: recurringId,
      updated_at: stamp,
    },
    { merge: true },
  );

  await batch.commit();

  await ensureThreadOnRelationship({
    parentId: payment.parent_id,
    tutorId: payment.tutor_id,
    learnerId: payment.learner_id,
    source: "paid",
  });

  await createInAppNotification({
    userId: payment.tutor_id,
    title: "New recurring schedule",
    body: `${schedule.learnerName ?? "A learner"} booked ${payment.lesson_count} weekly lessons with you.`,
    link: "/tutor/calendar",
  });

  await createInAppNotification({
    userId: payment.parent_id,
    title: "Schedule confirmed",
    body: `Your weekly lessons with ${schedule.listingHeadline ?? "your tutor"} are locked in.`,
    link: "/parent/schedule?payment_id=" + payment.id,
  });

  revalidatePath("/parent/schedule");
  revalidatePath("/parent/bookings");
  revalidatePath("/parent/messages");
  revalidatePath("/tutor/calendar");
  revalidatePath("/tutor/messages");
  revalidatePath("/tutor");

  redirect(`/parent/schedule?payment_id=${encodeURIComponent(payment.id)}&created=1`);
}

export async function listParentUpcomingLessons(): Promise<{
  lessons: ScheduledLesson[];
  error?: string;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { lessons: [], error: ctx.error };

  try {
    const snap = await db()
      .collection(COLLECTIONS.scheduledLessons)
      .where("parent_id", "==", ctx.profile.id)
      .where("status", "==", "scheduled")
      .get();

    const now = Date.now();
    const lessons = snap.docs
      .map((d) => d.data() as ScheduledLesson)
      .filter((l) => new Date(l.slot_end).getTime() >= now - 60 * 60 * 1000)
      .sort(
        (a, b) =>
          new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime(),
      );
    return { lessons: await ensureLessonMeetingUrls(lessons) };
  } catch {
    return { lessons: [], error: "Could not load upcoming lessons." };
  }
}

export async function listTutorUpcomingLessons(): Promise<{
  lessons: ScheduledLesson[];
  error?: string;
}> {
  if (!isAuthConfigured()) {
    return { lessons: [], error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) return { lessons: [], error: "Please sign in." };
  if (profile.role !== "tutor") {
    return { lessons: [], error: "Tutor account required." };
  }

  try {
    const snap = await db()
      .collection(COLLECTIONS.scheduledLessons)
      .where("tutor_id", "==", profile.id)
      .where("status", "==", "scheduled")
      .get();

    const now = Date.now();
    const lessons = snap.docs
      .map((d) => d.data() as ScheduledLesson)
      .filter((l) => new Date(l.slot_end).getTime() >= now - 60 * 60 * 1000)
      .sort(
        (a, b) =>
          new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime(),
      );
    return { lessons: await ensureLessonMeetingUrls(lessons) };
  } catch {
    return { lessons: [], error: "Could not load calendar." };
  }
}
