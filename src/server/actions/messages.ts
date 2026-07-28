"use server";

import {
  MESSAGES_SAFETY_COPY,
  normalizeMessageBody,
  type MessageThread,
} from "@/domain/messages";
import { COLLECTIONS, db } from "@/lib/firebase/db";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  getSessionUser,
  isAuthConfigured,
} from "@/lib/firebase/server-auth";
import { createInAppNotification } from "@/server/actions/notifications";
import {
  appendThreadMessage,
  ensureMessageThread,
  listThreadMessagesForAdmin,
} from "@/server/services/messages";
import { getCurrentProfile } from "@/server/services/profile";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SendMessageState = {
  error?: string;
  success?: string;
};

export type ThreadListItem = MessageThread & {
  learner_name: string | null;
  counterpart_label: string;
};

async function requireMessagingProfile() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return {
      ok: false as const,
      error: "Please sign in.",
      needsAuth: true as const,
    };
  }
  if (
    profile.role !== "parent" &&
    profile.role !== "adult" &&
    profile.role !== "tutor" &&
    profile.role !== "admin"
  ) {
    return { ok: false as const, error: "Messaging is not available." };
  }
  return { ok: true as const, profile };
}

function canAccessThread(
  thread: MessageThread,
  profileId: string,
  role: string,
): boolean {
  if (role === "admin") return true;
  return (
    thread.parent_id === profileId || thread.tutor_id === profileId
  );
}

async function learnerName(learnerId: string): Promise<string | null> {
  const snap = await db()
    .collection(COLLECTIONS.learnerProfiles)
    .doc(learnerId)
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as { display_name?: string; name?: string };
  return data.display_name ?? data.name ?? null;
}

async function profileLabel(uid: string): Promise<string> {
  const snap = await db().collection(COLLECTIONS.profiles).doc(uid).get();
  const email = snap.data()?.email as string | undefined;
  return email ?? "Member";
}

/** Mint Firebase Auth custom token so the browser can use Firestore listeners. */
export async function getFirestoreClientToken(): Promise<{
  token?: string;
  error?: string;
}> {
  if (!isAuthConfigured()) {
    return { error: "Firebase is not configured." };
  }
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in." };
  try {
    const token = await getAdminAuth().createCustomToken(user.uid);
    return { token };
  } catch (err) {
    console.error("[getFirestoreClientToken]", err);
    return { error: "Could not start live messaging." };
  }
}

/**
 * Ensure threads exist for active trial/paid relationships, then list them.
 */
export async function listMyMessageThreads(): Promise<{
  threads: ThreadListItem[];
  safetyCopy: string;
  error?: string;
}> {
  const ctx = await requireMessagingProfile();
  if (!ctx.ok) {
    return { threads: [], safetyCopy: MESSAGES_SAFETY_COPY, error: ctx.error };
  }

  try {
    await syncThreadsForProfile(ctx.profile.id, ctx.profile.role);

    const snap = await db()
      .collection(COLLECTIONS.messageThreads)
      .where("participant_ids", "array-contains", ctx.profile.id)
      .limit(50)
      .get();

    const threads: ThreadListItem[] = [];
    for (const doc of snap.docs) {
      const thread = { ...(doc.data() as MessageThread), id: doc.id };
      const name = await learnerName(thread.learner_id);
      const counterpartId =
        ctx.profile.role === "tutor" ? thread.parent_id : thread.tutor_id;
      const counterpart = await profileLabel(counterpartId);
      threads.push({
        ...thread,
        learner_name: name,
        counterpart_label:
          ctx.profile.role === "tutor"
            ? `Family · ${counterpart}`
            : `Tutor · ${counterpart}`,
      });
    }

    threads.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    return { threads, safetyCopy: MESSAGES_SAFETY_COPY };
  } catch (err) {
    console.error("[listMyMessageThreads]", err);
    return {
      threads: [],
      safetyCopy: MESSAGES_SAFETY_COPY,
      error: "Could not load messages.",
    };
  }
}

async function syncThreadsForProfile(
  profileId: string,
  role: string,
): Promise<void> {
  const isTutor = role === "tutor";
  const partyField = isTutor ? "tutor_id" : "parent_id";

  const [trials, recurring] = await Promise.all([
    db()
      .collection(COLLECTIONS.trialBookings)
      .where(partyField, "==", profileId)
      .get(),
    db()
      .collection(COLLECTIONS.recurringBookings)
      .where(partyField, "==", profileId)
      .get(),
  ]);

  for (const doc of trials.docs) {
    const t = doc.data() as {
      parent_id: string;
      tutor_id: string;
      learner_id: string;
      status: string;
    };
    if (t.status !== "accepted" && t.status !== "completed") continue;
    await ensureMessageThread({
      parentId: t.parent_id,
      tutorId: t.tutor_id,
      learnerId: t.learner_id,
      source: "trial",
    });
  }

  for (const doc of recurring.docs) {
    const r = doc.data() as {
      parent_id: string;
      tutor_id: string;
      learner_id: string;
      status: string;
    };
    if (r.status === "cancelled") continue;
    await ensureMessageThread({
      parentId: r.parent_id,
      tutorId: r.tutor_id,
      learnerId: r.learner_id,
      source: "paid",
    });
  }
}

export async function getMessageThreadForMe(threadId: string): Promise<{
  thread?: MessageThread & {
    learner_name: string | null;
    counterpart_label: string;
  };
  currentUserId?: string;
  safetyCopy: string;
  error?: string;
}> {
  const ctx = await requireMessagingProfile();
  if (!ctx.ok) {
    return { safetyCopy: MESSAGES_SAFETY_COPY, error: ctx.error };
  }

  const snap = await db()
    .collection(COLLECTIONS.messageThreads)
    .doc(threadId)
    .get();
  if (!snap.exists) {
    return { safetyCopy: MESSAGES_SAFETY_COPY, error: "Thread not found." };
  }
  const thread = { ...(snap.data() as MessageThread), id: snap.id };
  if (!canAccessThread(thread, ctx.profile.id, ctx.profile.role)) {
    return { safetyCopy: MESSAGES_SAFETY_COPY, error: "Not allowed." };
  }

  const name = await learnerName(thread.learner_id);
  const counterpartId =
    ctx.profile.role === "tutor" ? thread.parent_id : thread.tutor_id;
  const counterpart = await profileLabel(counterpartId);

  return {
    thread: {
      ...thread,
      learner_name: name,
      counterpart_label:
        ctx.profile.role === "tutor"
          ? `Family · ${counterpart}`
          : `Tutor · ${counterpart}`,
    },
    currentUserId: ctx.profile.id,
    safetyCopy: MESSAGES_SAFETY_COPY,
  };
}

export async function sendThreadMessage(
  _prev: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const threadId = String(formData.get("threadId") ?? "").trim();
  const rawBody = String(formData.get("body") ?? "");
  const ctx = await requireMessagingProfile();
  if (!ctx.ok) {
    if ("needsAuth" in ctx && ctx.needsAuth) {
      redirect("/sign-in?next=/parent/messages");
    }
    return { error: ctx.error };
  }

  const parsed = normalizeMessageBody(rawBody);
  if (!parsed.ok) return { error: parsed.error };
  if (!threadId) return { error: "Missing conversation." };

  const snap = await db()
    .collection(COLLECTIONS.messageThreads)
    .doc(threadId)
    .get();
  if (!snap.exists) return { error: "Thread not found." };
  const thread = { ...(snap.data() as MessageThread), id: snap.id };
  if (!canAccessThread(thread, ctx.profile.id, ctx.profile.role)) {
    return { error: "Not allowed." };
  }

  const senderRole =
    ctx.profile.role === "tutor"
      ? "tutor"
      : ctx.profile.role === "admin"
        ? "admin"
        : ctx.profile.role === "adult"
          ? "adult"
          : "parent";

  await appendThreadMessage({
    thread,
    senderId: ctx.profile.id,
    senderRole,
    body: parsed.body,
  });

  const recipientId =
    ctx.profile.id === thread.parent_id ? thread.tutor_id : thread.parent_id;
  const link =
    recipientId === thread.parent_id
      ? `/parent/messages/${thread.id}`
      : `/tutor/messages/${thread.id}`;

  await createInAppNotification({
    userId: recipientId,
    title: "New message",
    body: messagePreviewSafe(parsed.body),
    link,
  });

  revalidatePath("/parent/messages");
  revalidatePath("/tutor/messages");
  revalidatePath(`/parent/messages/${thread.id}`);
  revalidatePath(`/tutor/messages/${thread.id}`);
  return { success: "Sent" };
}

function messagePreviewSafe(body: string): string {
  const one = body.replace(/\s+/g, " ").trim();
  return one.length > 100 ? `${one.slice(0, 99)}…` : one;
}

export async function ensureThreadOnRelationship(input: {
  parentId: string;
  tutorId: string;
  learnerId: string;
  source: "trial" | "paid";
}): Promise<void> {
  if (!isAuthConfigured()) return;
  await ensureMessageThread(input);
}

/** Epic 7: load messages for a support case (admin only). */
export async function adminListThreadMessages(threadId: string): Promise<{
  messages: Awaited<ReturnType<typeof listThreadMessagesForAdmin>>;
  error?: string;
}> {
  const ctx = await requireMessagingProfile();
  if (!ctx.ok || ctx.profile.role !== "admin") {
    return { messages: [], error: "Admin only." };
  }
  try {
    const messages = await listThreadMessagesForAdmin(threadId);
    return { messages };
  } catch {
    return { messages: [], error: "Could not load thread." };
  }
}
