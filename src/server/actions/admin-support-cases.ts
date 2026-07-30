"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AttendanceRecord } from "@/domain/attendance";
import { attendanceOutcomeLabel } from "@/domain/attendance";
import type { ThreadMessage } from "@/domain/messages";
import { threadUniqueKey } from "@/domain/messages";
import type { ScheduledLesson } from "@/domain/recurring-bookings";
import {
  isSupportCaseStatus,
  supportBookingKindLabel,
  supportCaseStatusLabel,
  supportCategoryLabel,
  type SupportCase,
  type SupportCaseStatus,
} from "@/domain/support-cases";
import type { TrialBooking } from "@/domain/trials";
import { formatSlotLabel } from "@/domain/trials";
import { COLLECTIONS, db, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { createInAppNotification } from "@/server/actions/notifications";
import { listThreadMessagesForAdmin } from "@/server/services/messages";
import { getCurrentProfile } from "@/server/services/profile";

export type AdminSupportCaseRow = SupportCase & {
  bookingLabel: string;
  parentEmail: string | null;
  tutorEmail: string | null;
  reporterEmail: string | null;
};

export type AdminSupportCaseDetail = {
  case: SupportCase;
  bookingLabel: string;
  bookingSummary: string;
  attendanceLabel: string | null;
  parentEmail: string | null;
  tutorEmail: string | null;
  learnerLabel: string | null;
  listingHeadline: string | null;
  threadId: string | null;
  messages: ThreadMessage[];
};

export type UpdateSupportCaseState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    status?: string;
    outcomeNote?: string;
  };
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

async function writeAuditLog(input: {
  actorId: string;
  action: string;
  entityId: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
}) {
  await db().collection(COLLECTIONS.auditLog).add({
    id: db().collection(COLLECTIONS.auditLog).doc().id,
    actor_id: input.actorId,
    action: input.action,
    entity_type: "support_case",
    entity_id: input.entityId,
    before_state: input.beforeState,
    after_state: input.afterState,
    created_at: nowIso(),
  });
}

async function profileEmail(uid: string): Promise<string | null> {
  const snap = await db().collection(COLLECTIONS.profiles).doc(uid).get();
  if (!snap.exists) return null;
  return (snap.data()?.email as string | undefined) ?? null;
}

async function bookingLabelFor(caseRow: SupportCase): Promise<string> {
  if (caseRow.booking_kind === "trial") {
    const snap = await db()
      .collection(COLLECTIONS.trialBookings)
      .doc(caseRow.booking_id)
      .get();
    if (!snap.exists) {
      return `${supportBookingKindLabel("trial")} · ${caseRow.booking_id.slice(0, 8)}`;
    }
    const booking = snap.data() as TrialBooking;
    return `Free trial · ${formatSlotLabel(new Date(booking.slot_start), new Date(booking.slot_end))}`;
  }

  const snap = await db()
    .collection(COLLECTIONS.scheduledLessons)
    .doc(caseRow.booking_id)
    .get();
  if (!snap.exists) {
    return `${supportBookingKindLabel("lesson")} · ${caseRow.booking_id.slice(0, 8)}`;
  }
  const lesson = snap.data() as ScheduledLesson;
  return `Lesson ${lesson.sequence} · ${formatSlotLabel(new Date(lesson.slot_start), new Date(lesson.slot_end))}`;
}

export async function listSupportCasesForAdmin(filter?: {
  status?: SupportCaseStatus | "active" | "all";
}): Promise<{ cases: AdminSupportCaseRow[]; error?: string }> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return { cases: [], error: ctx.error };

  try {
    const snap = await db().collection(COLLECTIONS.supportCases).get();
    let rows = snap.docs.map((d) => ({ ...(d.data() as SupportCase), id: d.id }));

    const statusFilter = filter?.status ?? "active";
    if (statusFilter === "active") {
      rows = rows.filter(
        (c) => c.status === "open" || c.status === "in_progress",
      );
    } else if (statusFilter !== "all") {
      rows = rows.filter((c) => c.status === statusFilter);
    }

    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

    const cases: AdminSupportCaseRow[] = await Promise.all(
      rows.map(async (row) => {
        const [bookingLabel, parentEmail, tutorEmail, reporterEmail] =
          await Promise.all([
            bookingLabelFor(row),
            profileEmail(row.parent_id),
            profileEmail(row.tutor_id),
            profileEmail(row.reporter_id),
          ]);
        return {
          ...row,
          bookingLabel,
          parentEmail,
          tutorEmail,
          reporterEmail,
        };
      }),
    );

    return { cases };
  } catch {
    return { cases: [], error: "Could not load support cases." };
  }
}

export async function getSupportCaseForAdmin(
  id: string,
): Promise<{ detail: AdminSupportCaseDetail | null; error?: string }> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return { detail: null, error: ctx.error };

  const snap = await db().collection(COLLECTIONS.supportCases).doc(id).get();
  if (!snap.exists) return { detail: null, error: "Case not found." };
  const caseRow = { ...(snap.data() as SupportCase), id: snap.id };

  const bookingLabel = await bookingLabelFor(caseRow);
  let bookingSummary = bookingLabel;
  let attendanceLabel: string | null = null;

  if (caseRow.booking_kind === "trial") {
    const trialSnap = await db()
      .collection(COLLECTIONS.trialBookings)
      .doc(caseRow.booking_id)
      .get();
    if (trialSnap.exists) {
      const trial = trialSnap.data() as TrialBooking;
      bookingSummary = `Trial status: ${trial.status} · ${formatSlotLabel(new Date(trial.slot_start), new Date(trial.slot_end))}`;
    }
  } else {
    const lessonSnap = await db()
      .collection(COLLECTIONS.scheduledLessons)
      .doc(caseRow.booking_id)
      .get();
    if (lessonSnap.exists) {
      const lesson = { ...(lessonSnap.data() as ScheduledLesson), id: lessonSnap.id };
      bookingSummary = `Paid lesson ${lesson.sequence} · status ${lesson.status} · ${formatSlotLabel(new Date(lesson.slot_start), new Date(lesson.slot_end))}`;
      if (lesson.attendance_record_id) {
        const attSnap = await db()
          .collection(COLLECTIONS.attendanceRecords)
          .doc(lesson.attendance_record_id)
          .get();
        if (attSnap.exists) {
          const att = attSnap.data() as AttendanceRecord;
          attendanceLabel = attendanceOutcomeLabel(att.outcome);
        }
      }
    }
  }

  const [parentEmail, tutorEmail, learnerSnap, listingSnap, threadSnap] =
    await Promise.all([
      profileEmail(caseRow.parent_id),
      profileEmail(caseRow.tutor_id),
      db().collection(COLLECTIONS.learnerProfiles).doc(caseRow.learner_id).get(),
      db().collection(COLLECTIONS.tutorListings).doc(caseRow.listing_id).get(),
      db()
        .collection(COLLECTIONS.messageThreads)
        .where(
          "unique_key",
          "==",
          threadUniqueKey(caseRow.parent_id, caseRow.tutor_id, caseRow.learner_id),
        )
        .limit(1)
        .get(),
    ]);

  const learnerLabel =
    (learnerSnap.data()?.display_name as string | undefined) ??
    (learnerSnap.data()?.name as string | undefined) ??
    null;
  const listingHeadline =
    (listingSnap.data()?.headline as string | undefined) ?? null;

  let threadId: string | null = null;
  let messages: ThreadMessage[] = [];
  if (!threadSnap.empty) {
    threadId = threadSnap.docs[0]!.id;
    messages = await listThreadMessagesForAdmin(threadId);
  }

  return {
    detail: {
      case: caseRow,
      bookingLabel,
      bookingSummary,
      attendanceLabel,
      parentEmail,
      tutorEmail,
      learnerLabel,
      listingHeadline,
      threadId,
      messages,
    },
  };
}

export async function updateSupportCase(
  _prev: UpdateSupportCaseState,
  formData: FormData,
): Promise<UpdateSupportCaseState> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return { error: ctx.error };

  const caseId = String(formData.get("caseId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  const internalNotes = String(formData.get("adminInternalNotes") ?? "").trim();
  const outcomeNote = String(formData.get("outcomeNote") ?? "").trim();

  if (!caseId) return { error: "Missing case id." };
  if (!isSupportCaseStatus(statusRaw)) {
    return { fieldErrors: { status: "Choose a valid status." } };
  }

  const status = statusRaw as SupportCaseStatus;
  if (
    (status === "resolved" || status === "closed") &&
    outcomeNote.length < 8
  ) {
    return {
      fieldErrors: {
        outcomeNote:
          "Add a short outcome note the reporter can see (at least 8 characters).",
      },
    };
  }

  const ref = db().collection(COLLECTIONS.supportCases).doc(caseId);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Case not found." };
  const before = { ...(snap.data() as SupportCase), id: snap.id };

  const stamp = nowIso();
  const after: SupportCase = {
    ...before,
    status,
    admin_internal_notes: internalNotes || null,
    outcome_note: outcomeNote || before.outcome_note,
    last_updated_by: ctx.profile.id,
    updated_at: stamp,
    resolved_at:
      status === "resolved"
        ? stamp
        : status === "open" || status === "in_progress"
          ? null
          : before.resolved_at,
    closed_at:
      status === "closed"
        ? stamp
        : status === "open" || status === "in_progress"
          ? null
          : before.closed_at,
  };

  try {
    await ref.set(after);
    await writeAuditLog({
      actorId: ctx.profile.id,
      action: `support_case_${status}`,
      entityId: caseId,
      beforeState: {
        status: before.status,
        outcome_note: before.outcome_note,
        admin_internal_notes: before.admin_internal_notes,
      },
      afterState: {
        status: after.status,
        outcome_note: after.outcome_note,
        admin_internal_notes: after.admin_internal_notes,
      },
    });
  } catch {
    return { error: "Could not update the case. Please try again." };
  }

  const reporterHome =
    before.reporter_role === "tutor" ? "/tutor/support" : "/parent/support";

  await createInAppNotification({
    userId: before.reporter_id,
    title: `Support update: ${supportCaseStatusLabel(status)}`,
    body:
      after.outcome_note?.trim() ||
      `Your ${supportCategoryLabel(before.category)} case is now ${supportCaseStatusLabel(status)}.`,
    link: reporterHome,
  });

  revalidatePath("/admin/cases");
  revalidatePath(`/admin/cases/${caseId}`);
  revalidatePath("/parent/support");
  revalidatePath("/tutor/support");
  redirect(`/admin/cases/${caseId}?saved=1`);
}
