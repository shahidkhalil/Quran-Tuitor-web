"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, docId, nowIso } from "@/lib/firebase/db";
import {
  isCloudinaryConfigured,
  uploadFileToCloudinary,
} from "@/lib/cloudinary";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";
import {
  PAYOUT_METHODS,
  type ApplicationEvent,
  type PayoutMethod,
  type TutorApplication,
} from "@/domain/tutor-applications";

export type ApplicationField =
  | "fullName"
  | "country"
  | "languages"
  | "credentialsSummary"
  | "childExperience"
  | "introVideo"
  | "payoutMethod"
  | "credentialFile";

export type ApplicationFormState = {
  error?: string;
  fieldErrors?: Partial<Record<ApplicationField, string>>;
};

const PAYOUT_VALUES = PAYOUT_METHODS.map((m) => m.value);

async function requireApplicant() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Please sign in to apply." };
  }
  if (
    profile.role !== "tutor_applicant" &&
    profile.role !== "tutor" &&
    profile.role !== "parent" &&
    profile.role !== "adult"
  ) {
    return {
      ok: false as const,
      error:
        "Sign in with your account, then start the tutor application from Teach with us.",
    };
  }
  return { ok: true as const, profile };
}

/** Switch current parent/adult session into tutor-applicant so they can apply on this login. */
export async function beginTutorApplicationWithCurrentAccount() {
  if (!isAuthConfigured()) {
    redirect("/sign-in?next=/teach");
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/sign-in?next=/teach");
  }

  if (profile.role === "tutor_applicant" || profile.role === "tutor") {
    redirect("/tutor/application");
  }

  if (profile.role !== "parent" && profile.role !== "adult") {
    redirect("/teach");
  }

  await db().collection("profiles").doc(profile.id).set(
    {
      role: "tutor_applicant",
      previous_role: profile.role,
      updated_at: nowIso(),
    },
    { merge: true },
  );

  revalidatePath("/teach");
  revalidatePath("/tutor");
  revalidatePath("/tutor/application");
  revalidatePath("/parent");
  redirect("/tutor/application");
}

export async function getMyApplication(): Promise<{
  application: TutorApplication | null;
  error?: string;
}> {
  const ctx = await requireApplicant();
  if (!ctx.ok) {
    return { application: null, error: ctx.error };
  }

  const snap = await db()
    .collection("tutor_applications")
    .where("applicant_id", "==", ctx.profile.id)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  return { application: doc ? (doc.data() as TutorApplication) : null };
}

export async function listPendingApplicationsForAdmin(): Promise<{
  applications: TutorApplication[];
  error?: string;
}> {
  if (!isAuthConfigured()) {
    return { applications: [], error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { applications: [], error: "Admin only." };
  }

  try {
    const snap = await db()
      .collection("tutor_applications")
      .where("status", "==", "pending")
      .orderBy("submitted_at", "asc")
      .get();
    return { applications: snap.docs.map((doc) => doc.data() as TutorApplication) };
  } catch {
    return { applications: [], error: "Could not load queue." };
  }
}

async function uploadAsset(
  userId: string,
  folder: string,
  file: File,
  maxBytes: number,
): Promise<{ path?: string; error?: string }> {
  if (!file || file.size === 0) {
    return {};
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      error: `File is too large (max ${maxMb} MB). Prefer a shorter clip or paste a video URL instead.`,
    };
  }

  if (!isCloudinaryConfigured()) {
    return {
      error:
        "File uploads are not configured. Add CLOUDINARY_API_SECRET to .env.local, or paste a video URL instead.",
    };
  }

  try {
    const uploaded = await uploadFileToCloudinary(
      file,
      `${folder}/${userId}`,
    );
    return { path: uploaded.url };
  } catch (err) {
    console.error("[cloudinary upload]", err);
    return {
      error: "Could not upload file to Cloudinary. Try again or use a URL.",
    };
  }
}

const MAX_CREDENTIAL_BYTES = 5 * 1024 * 1024;
const MAX_INTRO_VIDEO_BYTES = 8 * 1024 * 1024;

export async function submitTutorApplication(
  _prev: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const ctx = await requireApplicant();
  if (!ctx.ok) {
    return { error: ctx.error };
  }

  const fieldErrors: Partial<Record<ApplicationField, string>> = {};

  const fullName = String(formData.get("fullName") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const genderRaw = String(formData.get("gender") ?? "").trim();
  const gender = genderRaw || null;
  const languages = String(formData.get("languages") ?? "").trim();
  const credentialsSummary = String(
    formData.get("credentialsSummary") ?? "",
  ).trim();
  const childExperience = String(formData.get("childExperience") ?? "").trim();
  const yearsRaw = String(formData.get("yearsTeaching") ?? "").trim();
  const introVideoUrl = String(formData.get("introVideoUrl") ?? "").trim();
  const payoutMethodRaw = String(formData.get("payoutMethod") ?? "").trim();
  const payoutNotes = String(formData.get("payoutNotes") ?? "").trim() || null;

  const credentialFile = formData.get("credentialFile");
  const introVideoFile = formData.get("introVideoFile");

  if (!fullName) fieldErrors.fullName = "Enter your full name.";
  if (!country) fieldErrors.country = "Enter your country.";
  if (!languages) fieldErrors.languages = "List the languages you teach in.";
  if (!credentialsSummary) {
    fieldErrors.credentialsSummary =
      "Summarise your credentials (e.g. Hafiz, Tajweed cert).";
  }
  if (!childExperience) {
    fieldErrors.childExperience =
      "Describe your experience teaching children.";
  }

  const payoutMethod = PAYOUT_VALUES.includes(payoutMethodRaw as PayoutMethod)
    ? (payoutMethodRaw as PayoutMethod)
    : null;
  if (!payoutMethod) {
    fieldErrors.payoutMethod = "Choose a preferred payout method.";
  }
  const payoutMethodValue = payoutMethod as PayoutMethod | null;

  const hasIntroUrl = introVideoUrl.length > 0;
  const hasIntroFile =
    introVideoFile instanceof File && introVideoFile.size > 0;
  const hasCredentialFile =
    credentialFile instanceof File && credentialFile.size > 0;

  if (!hasCredentialFile) {
    fieldErrors.credentialFile =
      "Upload a PDF or image of your Ijazah / certificate.";
  }

  let yearsTeaching: number | null = null;
  if (yearsRaw) {
    const n = Number(yearsRaw);
    if (!Number.isFinite(n) || n < 0 || n > 60) {
      return {
        error: "Years teaching must be a number between 0 and 60.",
      };
    }
    yearsTeaching = Math.floor(n);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Please fix the highlighted fields." };
  }

  const existingSnap = await db()
    .collection("tutor_applications")
    .where("applicant_id", "==", ctx.profile.id)
    .limit(1)
    .get();
  if (!existingSnap.empty) {
    return {
      error:
        "You already submitted an application. Check status from your tutor home.",
    };
  }

  let credentialPaths: string[] = [];
  if (hasCredentialFile) {
    const credentialUpload = await uploadAsset(
      ctx.profile.id,
      "credentials",
      credentialFile as File,
      MAX_CREDENTIAL_BYTES,
    );
    if (credentialUpload.error) {
      return {
        fieldErrors: { credentialFile: credentialUpload.error },
        error: credentialUpload.error,
      };
    }
    if (credentialUpload.path) credentialPaths = [credentialUpload.path];
  }

  let introVideoPath: string | null = null;
  if (hasIntroFile) {
    const videoUpload = await uploadAsset(
      ctx.profile.id,
      "intro",
      introVideoFile as File,
      MAX_INTRO_VIDEO_BYTES,
    );
    if (videoUpload.error) {
      return {
        fieldErrors: { introVideo: videoUpload.error },
        error: videoUpload.error,
      };
    }
    introVideoPath = videoUpload.path ?? null;
  }

  const applicationId = docId();
  await db().collection("tutor_applications").doc(applicationId).set({
    id: applicationId,
    applicant_id: ctx.profile.id,
    status: "pending",
    full_name: fullName,
    country,
    phone,
    gender,
    languages,
    credentials_summary: credentialsSummary,
    credential_paths: credentialPaths,
    child_experience: childExperience,
    years_teaching: yearsTeaching,
    intro_video_url: hasIntroUrl ? introVideoUrl : null,
    intro_video_path: introVideoPath,
    payout_method: payoutMethodValue as PayoutMethod,
    payout_notes: payoutNotes,
    status_reason: null,
    applicant_response: null,
    applicant_response_at: null,
    submitted_at: nowIso(),
    created_at: nowIso(),
    updated_at: nowIso(),
  } satisfies TutorApplication);

  await db().collection("tutor_application_events").add({
      id: docId(),
      application_id: applicationId,
      status: "pending",
      note: "Application submitted",
      actor_id: ctx.profile.id,
      actor_role: "applicant",
      created_at: nowIso(),
    });

  const { notifyApplicationStatus } = await import(
    "@/server/actions/notifications"
  );
  await notifyApplicationStatus(ctx.profile.id, "pending");

  // Ensure role stays tutor_applicant until admin approves (Story 2.3)
  if (ctx.profile.role === "tutor_applicant") {
    await db().collection("profiles").doc(ctx.profile.id).set(
      {
        role: "tutor_applicant",
        updated_at: nowIso(),
      },
      { merge: true },
    );
  }

  revalidatePath("/tutor");
  revalidatePath("/tutor/application");
  revalidatePath("/admin");
  redirect("/tutor/application?submitted=1");
}

export async function getMyApplicationEvents(
  applicationId: string,
): Promise<{ events: ApplicationEvent[]; error?: string }> {
  const ctx = await requireApplicant();
  if (!ctx.ok) {
    return { events: [], error: ctx.error };
  }

  const snap = await db()
    .collection("tutor_application_events")
    .where("application_id", "==", applicationId)
    .orderBy("created_at", "asc")
    .get();
  return { events: snap.docs.map((doc) => doc.data() as ApplicationEvent) };
}

export type NeedsInfoFormState = {
  error?: string;
  success?: boolean;
};

export async function respondToNeedsInfo(
  _prev: NeedsInfoFormState,
  formData: FormData,
): Promise<NeedsInfoFormState> {
  const ctx = await requireApplicant();
  if (!ctx.ok) {
    return { error: ctx.error };
  }

  const response = String(formData.get("response") ?? "").trim();
  const extraFile = formData.get("extraFile");

  if (!response) {
    return { error: "Please write a response to the reviewer’s request." };
  }

  const appSnap = await db()
    .collection("tutor_applications")
    .where("applicant_id", "==", ctx.profile.id)
    .limit(1)
    .get();
  const application = appSnap.docs[0]?.data() as TutorApplication | undefined;
  if (!application) {
    return { error: "Application not found." };
  }

  if (application.status !== "needs_info") {
    return { error: "This application is not waiting for more information." };
  }

  let newPaths: string[] = [...(application.credential_paths ?? [])];
  if (extraFile instanceof File && extraFile.size > 0) {
    const upload = await uploadAsset(
      ctx.profile.id,
      "credentials",
      extraFile,
      MAX_CREDENTIAL_BYTES,
    );
    if (upload.error) {
      return { error: upload.error };
    }
    if (upload.path) newPaths = [...newPaths, upload.path];
  }

  await db().collection("tutor_applications").doc(application.id).set(
    {
      status: "pending",
      applicant_response: response,
      applicant_response_at: nowIso(),
      credential_paths: newPaths,
      status_reason: null,
      updated_at: nowIso(),
    },
    { merge: true },
  );

  await db().collection("tutor_application_events").add({
    id: docId(),
    application_id: application.id,
    status: "pending",
    note: response,
    actor_id: ctx.profile.id,
    actor_role: "applicant",
    created_at: nowIso(),
  });

  const { notifyApplicationStatus } = await import(
    "@/server/actions/notifications"
  );
  await notifyApplicationStatus(ctx.profile.id, "pending");

  revalidatePath("/tutor");
  revalidatePath("/tutor/application");
  revalidatePath("/admin");
  redirect("/tutor/application?responded=1");
}
