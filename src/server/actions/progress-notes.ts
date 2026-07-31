"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canSubmitProgressNote,
  normalizeProgressField,
  type ProgressNote,
} from "@/domain/progress-notes";
import {
  parseHomeworkChecklistItems,
  toggleDoneKeys,
} from "@/domain/homework-checklist";
import type { ScheduledLesson } from "@/domain/recurring-bookings";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { createInAppNotification } from "@/server/actions/notifications";
import { getCurrentProfile } from "@/server/services/profile";

export type ProgressNoteFormState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    covered?: string;
    improve?: string;
    homework?: string;
  };
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
    return { ok: false as const, error: "Only the lesson tutor can submit notes." };
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

export async function submitProgressNote(
  _prev: ProgressNoteFormState,
  formData: FormData,
): Promise<ProgressNoteFormState> {
  const lessonId = String(formData.get("lessonId") ?? "").trim();
  const coveredRaw = String(formData.get("covered") ?? "");
  const improveRaw = String(formData.get("improve") ?? "");
  const homeworkRaw = String(formData.get("homework") ?? "");

  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect("/sign-in?next=/tutor/calendar");
    }
    return { error: ctx.error };
  }

  const covered = normalizeProgressField(coveredRaw, "Covered");
  const improve = normalizeProgressField(improveRaw, "Improve");
  const homework = normalizeProgressField(homeworkRaw, "Homework");
  const fieldErrors: ProgressNoteFormState["fieldErrors"] = {};
  if (!covered.ok) fieldErrors.covered = covered.error;
  if (!improve.ok) fieldErrors.improve = improve.error;
  if (!homework.ok) fieldErrors.homework = homework.error;
  if (!covered.ok || !improve.ok || !homework.ok) {
    return { fieldErrors, error: "Check the progress note fields." };
  }
  if (!lessonId) return { error: "Missing lesson." };

  const lessonRef = db().collection(COLLECTIONS.scheduledLessons).doc(lessonId);
  const lessonSnap = await lessonRef.get();
  if (!lessonSnap.exists) return { error: "Lesson not found." };
  const lesson = { ...(lessonSnap.data() as ScheduledLesson), id: lessonSnap.id };

  if (lesson.tutor_id !== ctx.profile.id) {
    return { error: "Not allowed." };
  }
  if (!canSubmitProgressNote(lesson)) {
    return {
      error: lesson.progress_note_id
        ? "A progress note was already submitted for this lesson."
        : "Mark the lesson completed before submitting a progress note.",
    };
  }

  const existing = await db()
    .collection(COLLECTIONS.progressNotes)
    .where("lesson_id", "==", lessonId)
    .limit(1)
    .get();
  if (!existing.empty) {
    return { error: "A progress note was already submitted for this lesson." };
  }

  const stamp = nowIso();
  const noteId = docId();
  const note: ProgressNote = {
    id: noteId,
    lesson_id: lesson.id,
    recurring_booking_id: lesson.recurring_booking_id,
    payment_id: lesson.payment_id,
    parent_id: lesson.parent_id,
    tutor_id: lesson.tutor_id,
    listing_id: lesson.listing_id,
    learner_id: lesson.learner_id,
    covered: covered.value,
    improve: improve.value,
    homework: homework.value,
    created_at: stamp,
    updated_at: stamp,
    admin_corrected_at: null,
    admin_corrected_by: null,
  };

  const batch = db().batch();
  batch.set(db().collection(COLLECTIONS.progressNotes).doc(noteId), note);
  batch.set(
    lessonRef,
    { progress_note_id: noteId, updated_at: stamp },
    { merge: true },
  );
  await batch.commit();

  const learnerSnap = await db()
    .collection(COLLECTIONS.learnerProfiles)
    .doc(lesson.learner_id)
    .get();
  const learnerName =
    (learnerSnap.data() as { display_name?: string } | undefined)
      ?.display_name ?? "your learner";

  await createInAppNotification({
    userId: lesson.parent_id,
    title: "New progress note",
    body: `A progress note for ${learnerName} is ready — covered, improve, and homework.`,
    link: `/parent/learners/${lesson.learner_id}/progress`,
  });

  revalidatePath("/tutor/calendar");
  revalidatePath("/parent/schedule");
  revalidatePath(`/parent/learners/${lesson.learner_id}/progress`);
  revalidatePath("/parent/learners");
  redirect(`/tutor/calendar?note=1&lesson=${encodeURIComponent(lessonId)}`);
}

export async function listProgressNotesForLearner(learnerId: string): Promise<{
  notes: ProgressNote[];
  learnerName: string | null;
  error?: string;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) {
    return { notes: [], learnerName: null, error: ctx.error };
  }

  const learnerSnap = await db()
    .collection(COLLECTIONS.learnerProfiles)
    .doc(learnerId)
    .get();
  if (!learnerSnap.exists) {
    return { notes: [], learnerName: null, error: "Learner not found." };
  }
  const learner = learnerSnap.data() as {
    parent_id: string;
    display_name?: string;
  };
  if (learner.parent_id !== ctx.profile.id) {
    return { notes: [], learnerName: null, error: "Not allowed." };
  }

  try {
    const snap = await db()
      .collection(COLLECTIONS.progressNotes)
      .where("learner_id", "==", learnerId)
      .where("parent_id", "==", ctx.profile.id)
      .get();

    const notes = snap.docs
      .map((d) => ({ ...(d.data() as ProgressNote), id: d.id }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return {
      notes,
      learnerName: learner.display_name ?? null,
    };
  } catch (err) {
    console.error("[listProgressNotesForLearner]", err);
    return {
      notes: [],
      learnerName: learner.display_name ?? null,
      error: "Could not load progress notes.",
    };
  }
}

/** Epic 7 / admin correction path — privileged update only. */
export async function adminCorrectProgressNote(
  noteId: string,
  fields: Pick<ProgressNote, "covered" | "improve" | "homework">,
): Promise<{ ok: boolean; error?: string }> {
  if (!isAuthConfigured()) return { ok: false, error: "Not configured." };
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { ok: false, error: "Admin only." };
  }

  const covered = normalizeProgressField(fields.covered, "Covered");
  const improve = normalizeProgressField(fields.improve, "Improve");
  const homework = normalizeProgressField(fields.homework, "Homework");
  if (!covered.ok || !improve.ok || !homework.ok) {
    return { ok: false, error: "Invalid fields." };
  }

  const stamp = nowIso();
  const ref = db().collection(COLLECTIONS.progressNotes).doc(noteId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: "Note not found." };

  await ref.set(
    {
      covered: covered.value,
      improve: improve.value,
      homework: homework.value,
      homework_done_keys: [],
      updated_at: stamp,
      admin_corrected_at: stamp,
      admin_corrected_by: profile.id,
    },
    { merge: true },
  );

  await db().collection(COLLECTIONS.auditLog).doc().set({
    id: docId(),
    actor_id: profile.id,
    action: "progress_note_correct",
    entity_type: "progress_notes",
    entity_id: noteId,
    before: {
      covered: (snap.data() as ProgressNote).covered,
      improve: (snap.data() as ProgressNote).improve,
      homework: (snap.data() as ProgressNote).homework,
    },
    after: {
      covered: covered.value,
      improve: improve.value,
      homework: homework.value,
    },
    created_at: stamp,
  });

  return { ok: true };
}

/** Parent toggles a homework checklist line on Revision. */
export async function toggleHomeworkChecklistItem(formData: FormData) {
  const noteId = String(formData.get("noteId") ?? "").trim();
  const itemKey = String(formData.get("itemKey") ?? "").trim();
  const intent = String(formData.get("intent") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/parent/revision").trim();

  const ctx = await requireParentLike();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect(`/sign-in?next=${encodeURIComponent(returnTo || "/parent/revision")}`);
    }
    redirect(returnTo || "/parent/revision");
  }

  if (!noteId || !itemKey || (intent !== "done" && intent !== "undone")) {
    redirect(returnTo || "/parent/revision");
  }

  const ref = db().collection(COLLECTIONS.progressNotes).doc(noteId);
  const snap = await ref.get();
  if (!snap.exists) redirect(returnTo || "/parent/revision");

  const note = { ...(snap.data() as ProgressNote), id: snap.id };
  if (note.parent_id !== ctx.profile.id) {
    redirect(returnTo || "/parent/revision");
  }

  const items = parseHomeworkChecklistItems(note.homework);
  if (!items.some((i) => i.key === itemKey)) {
    redirect(returnTo || "/parent/revision");
  }

  const homework_done_keys = toggleDoneKeys(
    note.homework_done_keys,
    itemKey,
    intent === "done",
  );

  await ref.set(
    {
      homework_done_keys,
      updated_at: nowIso(),
    },
    { merge: true },
  );

  revalidatePath("/parent/revision");
  revalidatePath(`/parent/learners/${note.learner_id}/progress`);
  revalidatePath("/parent/watch");
  redirect(returnTo.startsWith("/parent") ? returnTo : "/parent/revision");
}
