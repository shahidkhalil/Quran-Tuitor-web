"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, nowIso } from "@/lib/firebase/db";
import { getAdminStorage } from "@/lib/firebase/admin";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";
import type { ApplicationStatus, TutorApplication } from "@/domain/tutor-applications";
import { notifyApplicationStatus } from "@/server/actions/notifications";

export type VettingDecision = "approve" | "reject" | "needs_info";

export type VettingFormState = {
  error?: string;
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

async function writeAuditLog(
  input: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    beforeState: Record<string, unknown> | null;
    afterState: Record<string, unknown> | null;
  },
) {
  await db().collection("audit_log").add({
    id: db().collection("audit_log").doc().id,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    before_state: input.beforeState,
    after_state: input.afterState,
    created_at: nowIso(),
  });
}

export async function getApplicationForAdmin(id: string): Promise<{
  application: TutorApplication | null;
  error?: string;
}> {
  const ctx = await requireAdmin();
  if (!ctx.ok) {
    return { application: null, error: ctx.error };
  }

  const snap = await db().collection("tutor_applications").doc(id).get();
  if (!snap.exists) {
    return { application: null, error: "Application not found." };
  }

  return { application: snap.data() as TutorApplication };
}

export async function getSignedAssetUrl(
  path: string,
): Promise<{ url: string | null; error?: string }> {
  const ctx = await requireAdmin();
  if (!ctx.ok) {
    return { url: null, error: ctx.error };
  }

  // Cloudinary (and other) HTTPS URLs are stored directly — no signing needed.
  if (/^https?:\/\//i.test(path)) {
    return { url: path };
  }

  try {
    const [url] = await getAdminStorage()
      .bucket()
      .file(path)
      .getSignedUrl({
        action: "read",
        expires: Date.now() + 60 * 60 * 1000,
      });
    return { url };
  } catch {
    return { url: null, error: "Could not load file." };
  }
}

export async function decideApplication(
  _prev: VettingFormState,
  formData: FormData,
): Promise<VettingFormState> {
  const ctx = await requireAdmin();
  if (!ctx.ok) {
    return { error: ctx.error };
  }

  const applicationId = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "") as VettingDecision;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!applicationId) {
    return { error: "Missing application." };
  }

  if (!["approve", "reject", "needs_info"].includes(decision)) {
    return { error: "Invalid decision." };
  }

  if ((decision === "reject" || decision === "needs_info") && !reason) {
    return { error: "A reason is required for reject or request more info." };
  }

  const applicationSnap = await db().collection("tutor_applications").doc(applicationId).get();
  if (!applicationSnap.exists) {
    return { error: "Application not found." };
  }
  const application = applicationSnap.data() as TutorApplication;

  if (application.status !== "pending") {
    return { error: "Only pending applications can be decided from the queue." };
  }

  const nextStatus: ApplicationStatus =
    decision === "approve"
      ? "approved"
      : decision === "reject"
        ? "rejected"
        : "needs_info";

  const beforeState = {
    status: application.status,
    status_reason: application.status_reason,
  };

  await db().collection("tutor_applications").doc(applicationId).set(
    {
      status: nextStatus,
      status_reason:
        decision === "approve" ? null : reason,
      updated_at: nowIso(),
    },
    { merge: true },
  );

  if (decision === "approve") {
    await db().collection("profiles").doc(application.applicant_id).set(
      {
        role: "tutor",
        updated_at: nowIso(),
      },
      { merge: true },
    );
  }

  await db().collection("tutor_application_events").add({
    id: db().collection("tutor_application_events").doc().id,
    application_id: applicationId,
    status: nextStatus,
    note:
      decision === "approve"
        ? "Application approved"
        : reason,
    actor_id: ctx.profile.id,
    actor_role: "admin",
    created_at: nowIso(),
  });

  await writeAuditLog({
    actorId: ctx.profile.id,
    action: `tutor_application.${decision}`,
    entityType: "tutor_applications",
    entityId: applicationId,
    beforeState,
    afterState: {
      status: nextStatus,
      status_reason: decision === "approve" ? null : reason,
    },
  });

  await notifyApplicationStatus(
    application.applicant_id,
    nextStatus,
    decision === "approve" ? null : reason,
  );

  revalidatePath("/admin");
  revalidatePath(`/admin/vetting/${applicationId}`);
  revalidatePath("/tutor/application");
  redirect("/admin?decided=1");
}
