"use server";

import { db, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";
import { notifyUser } from "@/server/services/notify-user";
import type { AppNotification } from "@/domain/tutor-applications";
import { statusLabel, type ApplicationStatus } from "@/domain/tutor-applications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInAppNotification(input: {
  userId: string;
  title: string;
  body: string;
  link?: string | null;
}) {
  if (!isAuthConfigured()) return;
  await notifyUser(input);
}

export async function notifyApplicationStatus(
  userId: string,
  status: ApplicationStatus,
  reason?: string | null,
) {
  const label = statusLabel(status);
  const body =
    status === "needs_info" || status === "rejected"
      ? `${label}. ${reason?.trim() || "See your application for details."}`
      : `Your tutor application is now: ${label}.`;

  await createInAppNotification({
    userId,
    title: `Application update: ${label}`,
    body,
    link: "/tutor/application",
  });
}

export async function listMyNotifications(): Promise<{
  notifications: AppNotification[];
  error?: string;
}> {
  if (!isAuthConfigured()) {
    return { notifications: [] };
  }
  const profile = await getCurrentProfile();
  if (!profile) return { notifications: [] };

  try {
    const snap = await db()
      .collection("notifications")
      .where("user_id", "==", profile.id)
      .orderBy("created_at", "desc")
      .limit(20)
      .get();
    return {
      notifications: snap.docs.map((doc) => {
        const data = doc.data() as AppNotification;
        return { ...data, id: doc.id };
      }),
    };
  } catch {
    return { notifications: [], error: "Could not load notifications." };
  }
}

async function resolveOwnedNotification(id: string, userId: string) {
  const direct = db().collection("notifications").doc(id);
  const snap = await direct.get();
  if (snap.exists) {
    const data = snap.data() as AppNotification;
    if (data.user_id === userId) return direct;
  }

  // Legacy rows where document id ≠ stored id field
  const legacy = await db()
    .collection("notifications")
    .where("user_id", "==", userId)
    .where("id", "==", id)
    .limit(1)
    .get();
  if (legacy.empty) return null;
  return legacy.docs[0]!.ref;
}

export async function markNotificationRead(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id || !isAuthConfigured()) return;
  const profile = await getCurrentProfile();
  if (!profile) return;

  const ref = await resolveOwnedNotification(id, profile.id);
  if (!ref) return;
  const snap = await ref.get();
  if (!snap.exists) return;
  const data = snap.data() as AppNotification;
  if (data.read_at) return;
  await ref.set({ read_at: nowIso() }, { merge: true });
  revalidatePath("/tutor", "layout");
  revalidatePath("/parent", "layout");
}

export async function openNotification(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const link = String(formData.get("link") ?? "");
  if (!id || !isAuthConfigured()) return;
  const profile = await getCurrentProfile();
  if (!profile) return;

  const ref = await resolveOwnedNotification(id, profile.id);
  if (ref) {
    const snap = await ref.get();
    if (snap.exists) {
      const data = snap.data() as AppNotification;
      if (!data.read_at) {
        await ref.set({ read_at: nowIso() }, { merge: true });
      }
    }
  }

  revalidatePath("/tutor", "layout");
  revalidatePath("/parent", "layout");

  if (link.startsWith("/")) {
    redirect(link);
  }
}
