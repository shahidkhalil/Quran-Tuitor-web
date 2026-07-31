"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  emptyHifzTracker,
  removeHifzEntry,
  upsertHifzEntry,
  validateHifzEntryInput,
  type HifzTracker,
} from "@/domain/hifz-tracker";
import type { LearnerProfile } from "@/domain/learners";
import { COLLECTIONS, db, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";

export type HifzFormState = {
  error?: string;
  success?: string;
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
    return { ok: false as const, error: "Parent account required." };
  }
  return { ok: true as const, profile };
}

async function loadOwnedLearner(learnerId: string, parentId: string) {
  const snap = await db()
    .collection(COLLECTIONS.learnerProfiles)
    .doc(learnerId)
    .get();
  if (!snap.exists) return null;
  const learner = snap.data() as LearnerProfile;
  if (learner.parent_id !== parentId || learner.archived_at) return null;
  return learner;
}

export async function getHifzTrackerForLearner(
  learnerId: string,
): Promise<{ tracker: HifzTracker | null; error?: string }> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { tracker: null, error: ctx.error };

  const learner = await loadOwnedLearner(learnerId, ctx.profile.id);
  if (!learner) return { tracker: null, error: "Learner not found." };

  try {
    const snap = await db()
      .collection(COLLECTIONS.hifzTrackers)
      .doc(learnerId)
      .get();
    if (!snap.exists) {
      return {
        tracker: emptyHifzTracker(learnerId, ctx.profile.id, nowIso()),
      };
    }
    const data = snap.data() as HifzTracker;
    return {
      tracker: {
        ...data,
        id: snap.id,
        entries: Array.isArray(data.entries) ? data.entries : [],
      },
    };
  } catch (err) {
    console.error("[getHifzTrackerForLearner]", err);
    return { tracker: null, error: "Could not load Hifz tracker." };
  }
}

export async function listParentHifzTrackers(): Promise<{
  trackers: HifzTracker[];
  error?: string;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { trackers: [], error: ctx.error };

  try {
    const snap = await db()
      .collection(COLLECTIONS.hifzTrackers)
      .where("parent_id", "==", ctx.profile.id)
      .get();
    const trackers = snap.docs.map((d) => {
      const data = d.data() as HifzTracker;
      return {
        ...data,
        id: d.id,
        entries: Array.isArray(data.entries) ? data.entries : [],
      };
    });
    return { trackers };
  } catch (err) {
    console.error("[listParentHifzTrackers]", err);
    return { trackers: [], error: "Could not load Hifz trackers." };
  }
}

export async function saveHifzSurahProgress(
  _prev: HifzFormState,
  formData: FormData,
): Promise<HifzFormState> {
  const learnerId = String(formData.get("learnerId") ?? "").trim();
  const surahNumber = Number(formData.get("surahNumber") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const ayahReached = String(formData.get("ayahReached") ?? "");
  const notes = String(formData.get("notes") ?? "");

  const ctx = await requireParentLike();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect(`/sign-in?next=/parent/hifz/${encodeURIComponent(learnerId)}`);
    }
    return { error: ctx.error };
  }

  const learner = await loadOwnedLearner(learnerId, ctx.profile.id);
  if (!learner) return { error: "Learner not found." };

  const validated = validateHifzEntryInput({
    surahNumber,
    status,
    ayahReached,
    notes,
  });
  if (!validated.ok) return { error: validated.error };

  const stamp = nowIso();
  const ref = db().collection(COLLECTIONS.hifzTrackers).doc(learnerId);
  const snap = await ref.get();
  const existing = snap.exists
    ? (snap.data() as HifzTracker)
    : emptyHifzTracker(learnerId, ctx.profile.id, stamp);

  const entry = {
    ...validated.entry,
    updated_at: stamp,
  };
  const tracker: HifzTracker = {
    ...existing,
    id: learnerId,
    learner_id: learnerId,
    parent_id: ctx.profile.id,
    entries: upsertHifzEntry(
      Array.isArray(existing.entries) ? existing.entries : [],
      entry,
    ),
    created_at: existing.created_at ?? stamp,
    updated_at: stamp,
  };

  await ref.set(tracker);

  revalidatePath("/parent/hifz");
  revalidatePath(`/parent/hifz/${learnerId}`);
  revalidatePath("/parent");
  redirect(`/parent/hifz/${encodeURIComponent(learnerId)}?saved=1`);
}

export async function clearHifzSurahProgress(formData: FormData) {
  const learnerId = String(formData.get("learnerId") ?? "").trim();
  const surahNumber = Number(formData.get("surahNumber") ?? "");

  const ctx = await requireParentLike();
  if (!ctx.ok) {
    redirect(`/sign-in?next=/parent/hifz/${encodeURIComponent(learnerId)}`);
  }

  const learner = await loadOwnedLearner(learnerId, ctx.profile.id);
  if (!learner || !Number.isInteger(surahNumber)) {
    redirect(`/parent/hifz/${encodeURIComponent(learnerId)}`);
  }

  const ref = db().collection(COLLECTIONS.hifzTrackers).doc(learnerId);
  const snap = await ref.get();
  if (snap.exists) {
    const existing = snap.data() as HifzTracker;
    const stamp = nowIso();
    await ref.set(
      {
        ...existing,
        entries: removeHifzEntry(
          Array.isArray(existing.entries) ? existing.entries : [],
          surahNumber,
        ),
        updated_at: stamp,
      },
      { merge: true },
    );
  }

  revalidatePath("/parent/hifz");
  revalidatePath(`/parent/hifz/${learnerId}`);
  redirect(`/parent/hifz/${encodeURIComponent(learnerId)}`);
}
