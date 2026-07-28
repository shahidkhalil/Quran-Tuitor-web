"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  attendanceOutcomeLabel,
  canMarkAttendance,
  isAttendanceOutcome,
  lessonStatusForOutcome,
  type AttendanceOutcome,
  type AttendanceRecord,
} from "@/domain/attendance";
import type { ScheduledLesson } from "@/domain/recurring-bookings";
import { buildLessonMeetingUrl } from "@/domain/recurring-bookings";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { createInAppNotification } from "@/server/actions/notifications";
import { creditPaidLessonEarnings } from "@/server/actions/ledger";
import { getCurrentProfile } from "@/server/services/profile";
import type { PlatformPayment } from "@/domain/payments";
import { formatLedgerAmount } from "@/domain/ledger";

export type MarkAttendanceState = {
  error?: string;
  success?: boolean;
  fieldErrors?: { outcome?: string };
};

async function requireVerifiedTutor() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Please sign in.", needsAuth: true as const };
  }
  if (profile.role !== "tutor") {
    return {
      ok: false as const,
      error: "Only the lesson tutor can mark attendance.",
    };
  }
  return { ok: true as const, profile };
}

async function requireParentLike() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Please sign in.", needsAuth: true as const };
  }
  if (profile.role !== "parent" && profile.role !== "adult") {
    return { ok: false as const, error: "Parent account required." };
  }
  return { ok: true as const, profile };
}

async function ensureLessonMeetingUrls(
  lessons: ScheduledLesson[],
): Promise<ScheduledLesson[]> {
  const stamp = nowIso();
  const out: ScheduledLesson[] = [];
  for (const lesson of lessons) {
    if (lesson.meeting_url || lesson.status !== "scheduled") {
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

export async function markLessonAttendance(
  _prev: MarkAttendanceState,
  formData: FormData,
): Promise<MarkAttendanceState> {
  const lessonId = String(formData.get("lessonId") ?? "").trim();
  const outcomeRaw = String(formData.get("outcome") ?? "").trim();
  const noteRaw = String(formData.get("note") ?? "").trim();

  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect("/sign-in?next=/tutor/calendar");
    }
    return { error: ctx.error };
  }

  if (!lessonId) return { error: "Missing lesson." };
  if (!isAttendanceOutcome(outcomeRaw)) {
    return {
      error: "Choose an attendance outcome.",
      fieldErrors: { outcome: "Select completed, no-show, or cancelled." },
    };
  }
  const outcome: AttendanceOutcome = outcomeRaw;

  const lessonRef = db().collection(COLLECTIONS.scheduledLessons).doc(lessonId);
  const lessonSnap = await lessonRef.get();
  if (!lessonSnap.exists) return { error: "Lesson not found." };

  const lesson = lessonSnap.data() as ScheduledLesson;
  if (lesson.tutor_id !== ctx.profile.id) {
    return { error: "You can only mark attendance for your own lessons." };
  }

  const existing = await db()
    .collection(COLLECTIONS.attendanceRecords)
    .where("lesson_id", "==", lessonId)
    .limit(1)
    .get();
  if (!existing.empty || lesson.status !== "scheduled") {
    return { error: "Attendance was already recorded for this lesson." };
  }

  if (!canMarkAttendance(lesson)) {
    return {
      error:
        "You can mark attendance after the lesson start time.",
    };
  }

  const stamp = nowIso();
  const attendanceId = docId();
  const note = noteRaw.slice(0, 500) || null;
  const record: AttendanceRecord = {
    id: attendanceId,
    lesson_id: lesson.id,
    recurring_booking_id: lesson.recurring_booking_id,
    payment_id: lesson.payment_id,
    parent_id: lesson.parent_id,
    tutor_id: lesson.tutor_id,
    listing_id: lesson.listing_id,
    learner_id: lesson.learner_id,
    outcome,
    marked_by: ctx.profile.id,
    note,
    created_at: stamp,
    updated_at: stamp,
  };

  const status = lessonStatusForOutcome(outcome);
  const batch = db().batch();
  batch.set(
    db().collection(COLLECTIONS.attendanceRecords).doc(attendanceId),
    record,
  );
  batch.set(
    lessonRef,
    {
      status,
      attendance_record_id: attendanceId,
      attendance_marked_at: stamp,
      updated_at: stamp,
    },
    { merge: true },
  );
  await batch.commit();

  if (outcome === "completed") {
    try {
      const paySnap = await db()
        .collection(COLLECTIONS.payments)
        .doc(lesson.payment_id)
        .get();
      if (paySnap.exists) {
        const payment = paySnap.data() as PlatformPayment;
        const earnings = await creditPaidLessonEarnings({
          lesson: { ...lesson, status: "completed", attendance_record_id: attendanceId },
          payment,
          attendanceRecordId: attendanceId,
        });
        if (earnings.error) {
          console.error("[markLessonAttendance earnings]", earnings.error);
        } else if (earnings.credited) {
          await createInAppNotification({
            userId: lesson.tutor_id,
            title: "Lesson earnings posted",
            body: `${formatLedgerAmount(earnings.netCents)} net credited after platform commission.`,
            link: "/tutor/earnings",
          });
        }
      }
    } catch (err) {
      console.error("[markLessonAttendance earnings]", err);
    }
  }

  const label = attendanceOutcomeLabel(outcome);
  const parentBody =
    outcome === "tutor_no_show"
      ? `Lesson ${lesson.sequence} was marked tutor no-show. Open Bookings to request rematch or reschedule support.`
      : `Lesson ${lesson.sequence} attendance: ${label}.`;

  await createInAppNotification({
    userId: lesson.parent_id,
    title: "Lesson attendance recorded",
    body: parentBody,
    link:
      outcome === "tutor_no_show"
        ? "/parent/bookings?help=tutor-no-show"
        : "/parent/schedule",
  });

  revalidatePath("/tutor/calendar");
  revalidatePath("/tutor");
  revalidatePath("/tutor/earnings");
  revalidatePath("/parent/schedule");
  revalidatePath("/parent/bookings");
  revalidatePath("/parent");

  redirect(
    `/tutor/calendar?attendance=${encodeURIComponent(outcome)}&lesson=${encodeURIComponent(lessonId)}`,
  );
}

/** Upcoming + awaiting attendance (scheduled past start). */
export async function listTutorCalendarLessons(): Promise<{
  lessons: ScheduledLesson[];
  error?: string;
}> {
  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) return { lessons: [], error: ctx.error };

  try {
    const snap = await db()
      .collection(COLLECTIONS.scheduledLessons)
      .where("tutor_id", "==", ctx.profile.id)
      .get();

    const now = Date.now();
    const pastBound = now - 90 * 24 * 60 * 60 * 1000;
    const futureBound = now + 120 * 24 * 60 * 60 * 1000;
    const lessons = snap.docs
      .map((d) => ({ ...(d.data() as ScheduledLesson), id: d.id }))
      .filter((l) => {
        const start = new Date(l.slot_start).getTime();
        return start >= pastBound && start <= futureBound;
      })
      .sort(
        (a, b) =>
          new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime(),
      );

    return { lessons: await ensureLessonMeetingUrls(lessons) };
  } catch {
    return { lessons: [], error: "Could not load calendar." };
  }
}

export async function listParentScheduleLessons(): Promise<{
  upcoming: ScheduledLesson[];
  recentAttendance: ScheduledLesson[];
  /** Wider window for month calendar (past + future). */
  calendarLessons: ScheduledLesson[];
  error?: string;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) {
    return {
      upcoming: [],
      recentAttendance: [],
      calendarLessons: [],
      error: ctx.error,
    };
  }

  try {
    const snap = await db()
      .collection(COLLECTIONS.scheduledLessons)
      .where("parent_id", "==", ctx.profile.id)
      .get();

    const now = Date.now();
    const weekAgo = now - 14 * 24 * 60 * 60 * 1000;
    const pastBound = now - 90 * 24 * 60 * 60 * 1000;
    const futureBound = now + 120 * 24 * 60 * 60 * 1000;
    const all = snap.docs.map((d) => ({
      ...(d.data() as ScheduledLesson),
      id: d.id,
    }));

    const upcoming = await ensureLessonMeetingUrls(
      all
        .filter(
          (l) =>
            l.status === "scheduled" &&
            new Date(l.slot_end).getTime() >= now - 60 * 60 * 1000,
        )
        .sort(
          (a, b) =>
            new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime(),
        ),
    );

    const recentAttendance = all
      .filter(
        (l) =>
          l.status !== "scheduled" &&
          new Date(l.slot_end).getTime() >= weekAgo,
      )
      .sort(
        (a, b) =>
          new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime(),
      );

    const calendarLessons = await ensureLessonMeetingUrls(
      all
        .filter((l) => {
          const t = new Date(l.slot_start).getTime();
          return t >= pastBound && t <= futureBound;
        })
        .sort(
          (a, b) =>
            new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime(),
        ),
    );

    return { upcoming, recentAttendance, calendarLessons };
  } catch {
    return {
      upcoming: [],
      recentAttendance: [],
      calendarLessons: [],
      error: "Could not load schedule.",
    };
  }
}
