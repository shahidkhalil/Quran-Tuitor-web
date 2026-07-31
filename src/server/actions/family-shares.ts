"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  FAMILY_INVITE_MAX_PENDING,
  canAcceptFamilyShare,
  canViewSharedWatch,
  familyShareStatusLabel,
  isValidInviteEmail,
  normalizeInviteEmail,
  type FamilyShare,
} from "@/domain/family-shares";
import { COLLECTIONS, db, docId, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getAppOrigin } from "@/lib/stripe";
import { headers } from "next/headers";
import { notifyUser } from "@/server/services/notify-user";
import { getCurrentProfile } from "@/server/services/profile";

export type FamilyInviteFormState = {
  error?: string;
  success?: string;
  inviteLink?: string;
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

function newInviteToken(): string {
  return randomBytes(24).toString("hex");
}

export async function listOwnedFamilyShares(): Promise<{
  shares: FamilyShare[];
  error?: string;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { shares: [], error: ctx.error };

  try {
    const snap = await db()
      .collection(COLLECTIONS.familyShares)
      .where("owner_parent_id", "==", ctx.profile.id)
      .get();
    const shares = snap.docs
      .map((d) => ({ ...(d.data() as FamilyShare), id: d.id }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { shares };
  } catch (err) {
    console.error("[listOwnedFamilyShares]", err);
    return { shares: [], error: "Could not load family invites." };
  }
}

export async function listSharedWithMe(): Promise<{
  shares: FamilyShare[];
  error?: string;
}> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { shares: [], error: ctx.error };

  try {
    const snap = await db()
      .collection(COLLECTIONS.familyShares)
      .where("member_profile_id", "==", ctx.profile.id)
      .get();
    const shares = snap.docs
      .map((d) => ({ ...(d.data() as FamilyShare), id: d.id }))
      .filter((s) => s.status === "active");
    return { shares };
  } catch (err) {
    console.error("[listSharedWithMe]", err);
    return { shares: [], error: "Could not load shared families." };
  }
}

/** Authorize view-only access to another parent's watch data. */
export async function assertCanViewFamilyWatch(
  ownerParentId: string,
): Promise<
  | { ok: true; share: FamilyShare; viewOnly: boolean }
  | { ok: false; error: string }
> {
  const ctx = await requireParentLike();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  if (ownerParentId === ctx.profile.id) {
    return {
      ok: true,
      share: {
        id: "self",
        owner_parent_id: ctx.profile.id,
        owner_email: ctx.profile.email,
        invitee_email: ctx.profile.email ?? "",
        member_profile_id: ctx.profile.id,
        status: "active",
        invite_token: "",
        created_at: "",
        updated_at: "",
        accepted_at: null,
      },
      viewOnly: false,
    };
  }

  try {
    const snap = await db()
      .collection(COLLECTIONS.familyShares)
      .where("member_profile_id", "==", ctx.profile.id)
      .get();
    const shareDoc = snap.docs.find((d) => {
      const s = d.data() as FamilyShare;
      return s.owner_parent_id === ownerParentId && s.status === "active";
    });
    if (!shareDoc) {
      return { ok: false, error: "You do not have access to this family." };
    }
    const share = { ...(shareDoc.data() as FamilyShare), id: shareDoc.id };
    if (!canViewSharedWatch(share, ctx.profile.id)) {
      return { ok: false, error: "You do not have access to this family." };
    }
    return { ok: true, share, viewOnly: true };
  } catch (err) {
    console.error("[assertCanViewFamilyWatch]", err);
    return { ok: false, error: "Could not verify family access." };
  }
}

export async function createFamilyInvite(
  _prev: FamilyInviteFormState,
  formData: FormData,
): Promise<FamilyInviteFormState> {
  const emailRaw = String(formData.get("email") ?? "");
  const email = normalizeInviteEmail(emailRaw);

  const ctx = await requireParentLike();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect("/sign-in?next=/parent/family");
    }
    return { error: ctx.error };
  }

  if (!isValidInviteEmail(email)) {
    return { error: "Enter a valid email address." };
  }
  if (email === normalizeInviteEmail(ctx.profile.email ?? "")) {
    return { error: "You cannot invite your own email." };
  }

  const existing = await db()
    .collection(COLLECTIONS.familyShares)
    .where("owner_parent_id", "==", ctx.profile.id)
    .get();

  const rows = existing.docs.map((d) => d.data() as FamilyShare);
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  if (pendingCount >= FAMILY_INVITE_MAX_PENDING) {
    return {
      error: `You already have ${FAMILY_INVITE_MAX_PENDING} pending invites. Revoke one first.`,
    };
  }

  const duplicate = rows.find(
    (r) =>
      r.invitee_email === email &&
      (r.status === "pending" || r.status === "active"),
  );
  if (duplicate) {
    return {
      error: `That email already has a ${familyShareStatusLabel(duplicate.status).toLowerCase()} invite.`,
    };
  }

  const stamp = nowIso();
  const id = docId();
  const invite_token = newInviteToken();
  const share: FamilyShare = {
    id,
    owner_parent_id: ctx.profile.id,
    owner_email: ctx.profile.email,
    invitee_email: email,
    member_profile_id: null,
    status: "pending",
    invite_token,
    created_at: stamp,
    updated_at: stamp,
    accepted_at: null,
  };

  await db().collection(COLLECTIONS.familyShares).doc(id).set(share);

  const hdrs = await headers();
  const origin = getAppOrigin(hdrs.get("origin"));
  const inviteLink = `${origin}/parent/family/accept?token=${encodeURIComponent(invite_token)}`;

  // If invitee already has an account, ping them in-app
  try {
    const profiles = await db()
      .collection(COLLECTIONS.profiles)
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!profiles.empty) {
      await notifyUser({
        userId: profiles.docs[0]!.id,
        title: "Family Watch invite",
        body: `${ctx.profile.email ?? "A parent"} invited you to view Parental Watch (read-only).`,
        link: `/parent/family/accept?token=${encodeURIComponent(invite_token)}`,
      });
    }
  } catch (err) {
    console.error("[createFamilyInvite notify]", err);
  }

  revalidatePath("/parent/family");
  return {
    success: `Invite created for ${email}. Share the link below.`,
    inviteLink,
  };
}

export async function revokeFamilyShare(formData: FormData) {
  const shareId = String(formData.get("shareId") ?? "").trim();
  const ctx = await requireParentLike();
  if (!ctx.ok) redirect("/sign-in?next=/parent/family");

  const ref = db().collection(COLLECTIONS.familyShares).doc(shareId);
  const snap = await ref.get();
  if (!snap.exists) redirect("/parent/family");
  const share = snap.data() as FamilyShare;
  if (share.owner_parent_id !== ctx.profile.id) redirect("/parent/family");

  await ref.set(
    {
      status: "revoked",
      updated_at: nowIso(),
    },
    { merge: true },
  );

  revalidatePath("/parent/family");
  revalidatePath("/parent/watch");
  redirect("/parent/family");
}

export async function acceptFamilyInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const ctx = await requireParentLike();
  if (!ctx.ok) {
    redirect(
      `/sign-in?next=${encodeURIComponent(`/parent/family/accept?token=${token}`)}`,
    );
  }

  if (!token) redirect("/parent/family");

  const snap = await db()
    .collection(COLLECTIONS.familyShares)
    .where("invite_token", "==", token)
    .limit(1)
    .get();

  if (snap.empty) {
    redirect("/parent/family/accept?error=invalid");
  }

  const doc = snap.docs[0]!;
  const share = { ...(doc.data() as FamilyShare), id: doc.id };
  const gate = canAcceptFamilyShare(share, {
    id: ctx.profile.id,
    email: ctx.profile.email,
  });
  if (!gate.ok) {
    redirect(
      `/parent/family/accept?token=${encodeURIComponent(token)}&error=${encodeURIComponent(gate.error)}`,
    );
  }

  const stamp = nowIso();
  await doc.ref.set(
    {
      status: "active",
      member_profile_id: ctx.profile.id,
      accepted_at: stamp,
      updated_at: stamp,
    },
    { merge: true },
  );

  await notifyUser({
    userId: share.owner_parent_id,
    title: "Family invite accepted",
    body: `${ctx.profile.email ?? "A co-parent"} can now view your Parental Watch.`,
    link: "/parent/family",
  });

  revalidatePath("/parent/family");
  revalidatePath("/parent/watch");
  redirect(`/parent/watch?family=${encodeURIComponent(share.owner_parent_id)}`);
}

export async function getFamilyInviteByToken(token: string): Promise<{
  share: FamilyShare | null;
  error?: string;
}> {
  if (!token.trim()) return { share: null, error: "Missing invite token." };
  try {
    const snap = await db()
      .collection(COLLECTIONS.familyShares)
      .where("invite_token", "==", token.trim())
      .limit(1)
      .get();
    if (snap.empty) return { share: null, error: "Invite not found." };
    return {
      share: { ...(snap.docs[0]!.data() as FamilyShare), id: snap.docs[0]!.id },
    };
  } catch (err) {
    console.error("[getFamilyInviteByToken]", err);
    return { share: null, error: "Could not load invite." };
  }
}

export type SharedWatchBundle = {
  viewOnly: boolean;
  ownerParentId: string;
  ownerEmail: string | null;
  learners: import("@/domain/learners").LearnerProfile[];
  upcoming: import("@/domain/recurring-bookings").ScheduledLesson[];
  recentAttendance: import("@/domain/recurring-bookings").ScheduledLesson[];
  bookings: import("@/domain/trials").TrialBooking[];
  notesByLearner: Map<
    string,
    import("@/domain/progress-notes").ProgressNote[]
  >;
  error?: string;
};

/** Load Parental Watch data for self or an authorized shared family. */
export async function loadParentalWatchBundle(
  ownerParentId: string,
): Promise<SharedWatchBundle> {
  const empty: SharedWatchBundle = {
    viewOnly: true,
    ownerParentId,
    ownerEmail: null,
    learners: [],
    upcoming: [],
    recentAttendance: [],
    bookings: [],
    notesByLearner: new Map(),
  };

  const gate = await assertCanViewFamilyWatch(ownerParentId);
  if (!gate.ok) return { ...empty, error: gate.error };

  try {
    const now = Date.now();
    const weekAgo = now - 14 * 24 * 60 * 60 * 1000;

    const [learnerSnap, lessonSnap, trialSnap, noteSnap] = await Promise.all([
      db()
        .collection(COLLECTIONS.learnerProfiles)
        .where("parent_id", "==", ownerParentId)
        .where("archived_at", "==", null)
        .get(),
      db()
        .collection(COLLECTIONS.scheduledLessons)
        .where("parent_id", "==", ownerParentId)
        .get(),
      db()
        .collection(COLLECTIONS.trialBookings)
        .where("parent_id", "==", ownerParentId)
        .get(),
      db()
        .collection(COLLECTIONS.progressNotes)
        .where("parent_id", "==", ownerParentId)
        .get(),
    ]);

    const learners = learnerSnap.docs
      .map((d) => d.data() as import("@/domain/learners").LearnerProfile)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

    const lessons = lessonSnap.docs.map((d) => ({
      ...(d.data() as import("@/domain/recurring-bookings").ScheduledLesson),
      id: d.id,
    }));

    const upcoming = lessons
      .filter(
        (l) =>
          l.status === "scheduled" &&
          new Date(l.slot_end).getTime() >= now - 60 * 60 * 1000,
      )
      .sort(
        (a, b) =>
          new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime(),
      );

    const recentAttendance = lessons
      .filter(
        (l) =>
          l.status !== "scheduled" &&
          new Date(l.slot_end).getTime() >= weekAgo,
      )
      .sort(
        (a, b) =>
          new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime(),
      );

    const bookings = trialSnap.docs.map(
      (d) => d.data() as import("@/domain/trials").TrialBooking,
    );

    const notesByLearner = new Map<
      string,
      import("@/domain/progress-notes").ProgressNote[]
    >();
    for (const d of noteSnap.docs) {
      const note = {
        ...(d.data() as import("@/domain/progress-notes").ProgressNote),
        id: d.id,
      };
      const list = notesByLearner.get(note.learner_id) ?? [];
      list.push(note);
      notesByLearner.set(note.learner_id, list);
    }
    for (const [id, list] of notesByLearner) {
      notesByLearner.set(
        id,
        list.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      );
    }

    return {
      viewOnly: gate.viewOnly,
      ownerParentId,
      ownerEmail: gate.share.owner_email,
      learners,
      upcoming,
      recentAttendance,
      bookings,
      notesByLearner,
    };
  } catch (err) {
    console.error("[loadParentalWatchBundle]", err);
    return { ...empty, viewOnly: gate.viewOnly, error: "Could not load watch data." };
  }
}
