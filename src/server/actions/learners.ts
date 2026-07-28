"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";
import type { AgeBand, LearnerProfile } from "@/domain/learners";
import { AGE_BANDS } from "@/domain/learners";
import type { Profile } from "@/server/services/profile";

export type LearnerFormState = {
  error?: string;
};

function parseAgeBand(raw: string): AgeBand | null {
  const value = raw.trim();
  if (!value) return null;
  if (AGE_BANDS.some((b) => b.value === value)) {
    return value as AgeBand;
  }
  return null;
}

type ParentCtx =
  | { ok: true; profile: Profile }
  | { ok: false; error: string };

async function requireParentContext(): Promise<ParentCtx> {
  if (!isAuthConfigured()) {
    return { ok: false, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false, error: "Please sign in." };
  }
  if (profile.role !== "parent" && profile.role !== "adult") {
    return {
      ok: false,
      error: "Only parent or adult accounts manage learners.",
    };
  }
  return { ok: true, profile };
}

export async function listLearners(): Promise<{
  learners: LearnerProfile[];
  error?: string;
}> {
  const ctx = await requireParentContext();
  if (!ctx.ok) {
    return { learners: [], error: ctx.error };
  }

  try {
    const snap = await db()
      .collection("learner_profiles")
      .where("parent_id", "==", ctx.profile.id)
      .where("archived_at", "==", null)
      .orderBy("created_at", "asc")
      .get();
    return { learners: snap.docs.map((doc) => doc.data() as LearnerProfile) };
  } catch {
    return { learners: [], error: "Could not load learners." };
  }
}

export async function getLearner(
  id: string,
): Promise<{ learner: LearnerProfile | null; error?: string }> {
  const ctx = await requireParentContext();
  if (!ctx.ok) {
    return { learner: null, error: ctx.error };
  }

  const snap = await db().collection("learner_profiles").doc(id).get();
  if (!snap.exists) return { learner: null, error: "Could not load learner." };
  const learner = snap.data() as LearnerProfile;
  if (learner.parent_id !== ctx.profile.id || learner.archived_at) {
    return { learner: null, error: "Could not load learner." };
  }
  return { learner };
}

export async function createLearner(
  _prev: LearnerFormState,
  formData: FormData,
): Promise<LearnerFormState> {
  const ctx = await requireParentContext();
  if (!ctx.ok) {
    return { error: ctx.error };
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const isAdultSelf = formData.get("isAdultSelf") === "on";
  const ageBand = parseAgeBand(String(formData.get("ageBand") ?? ""));
  const levelGoals = String(formData.get("levelGoals") ?? "").trim() || null;
  const genderNotes =
    String(formData.get("genderPreferenceNotes") ?? "").trim() || null;

  if (!displayName) {
    return { error: "Enter a name for the learner." };
  }

  const id = docId();
  await db().collection("learner_profiles").doc(id).set({
    id,
    parent_id: ctx.profile.id,
    display_name: displayName,
    age_band: isAdultSelf ? "adult" : ageBand,
    is_adult_self: isAdultSelf,
    level_goals: levelGoals,
    gender_preference_notes: genderNotes,
    archived_at: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  } satisfies LearnerProfile);

  revalidatePath("/parent/learners");
  revalidatePath("/parent/bookings");
  revalidatePath("/browse");

  const returnTo = String(formData.get("returnTo") ?? "").trim();
  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    redirect(returnTo);
  }
  redirect("/parent/learners");
}

export async function updateLearner(
  _prev: LearnerFormState,
  formData: FormData,
): Promise<LearnerFormState> {
  const ctx = await requireParentContext();
  if (!ctx.ok) {
    return { error: ctx.error };
  }

  const id = String(formData.get("id") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const isAdultSelf = formData.get("isAdultSelf") === "on";
  const ageBand = parseAgeBand(String(formData.get("ageBand") ?? ""));
  const levelGoals = String(formData.get("levelGoals") ?? "").trim() || null;
  const genderNotes =
    String(formData.get("genderPreferenceNotes") ?? "").trim() || null;

  if (!id) return { error: "Missing learner." };
  if (!displayName) return { error: "Enter a name for the learner." };

  const ref = db().collection("learner_profiles").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Could not update learner. Please try again." };
  const current = snap.data() as LearnerProfile;
  if (current.parent_id !== ctx.profile.id || current.archived_at) {
    return { error: "Could not update learner. Please try again." };
  }
  await ref.update({
    display_name: displayName,
    age_band: isAdultSelf ? "adult" : ageBand,
    is_adult_self: isAdultSelf,
    level_goals: levelGoals,
    gender_preference_notes: genderNotes,
    updated_at: nowIso(),
  });

  revalidatePath("/parent/learners");
  revalidatePath(`/parent/learners/${id}/edit`);
  redirect("/parent/learners");
}

export async function archiveLearner(formData: FormData) {
  const ctx = await requireParentContext();
  if (!ctx.ok) {
    redirect("/sign-in");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/parent/learners");

  const ref = db().collection("learner_profiles").doc(id);
  const snap = await ref.get();
  if (snap.exists) {
    const current = snap.data() as LearnerProfile;
    if (current.parent_id === ctx.profile.id) {
      await ref.update({
        archived_at: nowIso(),
        updated_at: nowIso(),
      });
    }
  }

  revalidatePath("/parent/learners");
  redirect("/parent/learners");
}
