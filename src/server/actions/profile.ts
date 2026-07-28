"use server";

import { revalidatePath } from "next/cache";
import {
  isCloudinaryConfigured,
  uploadFileToCloudinary,
} from "@/lib/cloudinary";
import { COLLECTIONS, db, nowIso } from "@/lib/firebase/db";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";

export type ProfilePhotoState = {
  error?: string;
  success?: string;
  photoUrl?: string | null;
};

async function requireSignedIn() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Please sign in." };
  }
  return { ok: true as const, profile };
}

function revalidateAccountSurfaces(role: string) {
  revalidatePath("/parent");
  revalidatePath("/parent/account");
  revalidatePath("/parent/account");
  revalidatePath("/tutor");
  revalidatePath("/tutor/account");
  revalidatePath("/tutor/listing");
  revalidatePath("/admin");
  revalidatePath("/admin/account");
  revalidatePath("/browse");
  if (role === "tutor" || role === "tutor_applicant") {
    /* listing pages revalidated via browse + listing */
  }
}

/** Sync account photo onto public tutor listing when present. */
async function syncListingPhoto(tutorId: string, photoUrl: string | null) {
  const ref = db().collection(COLLECTIONS.tutorListings).doc(tutorId);
  const snap = await ref.get();
  if (!snap.exists) return;
  await ref.set(
    {
      photo_url: photoUrl,
      updated_at: nowIso(),
    },
    { merge: true },
  );
  revalidatePath(`/browse/${tutorId}`);
}

export async function uploadProfilePhoto(
  _prev: ProfilePhotoState,
  formData: FormData,
): Promise<ProfilePhotoState> {
  const ctx = await requireSignedIn();
  if (!ctx.ok) return { error: ctx.error };

  if (!isCloudinaryConfigured()) {
    return {
      error:
        "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Use a JPG, PNG, or WebP image." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Photo must be 5 MB or smaller." };
  }

  let url: string;
  try {
    const uploaded = await uploadFileToCloudinary(
      file,
      `profile-photos/${ctx.profile.id}`,
    );
    url = uploaded.url;
  } catch (err) {
    console.error("[uploadProfilePhoto]", err);
    return { error: "Upload failed. Please try again." };
  }

  await db().collection(COLLECTIONS.profiles).doc(ctx.profile.id).set(
    {
      photo_url: url,
      updated_at: nowIso(),
    },
    { merge: true },
  );

  if (ctx.profile.role === "tutor" || ctx.profile.role === "tutor_applicant") {
    await syncListingPhoto(ctx.profile.id, url);
  }

  revalidateAccountSurfaces(ctx.profile.role);
  return {
    success: "Profile photo updated.",
    photoUrl: url,
  };
}

export async function removeProfilePhoto(
  _prev: ProfilePhotoState,
  _formData: FormData,
): Promise<ProfilePhotoState> {
  const ctx = await requireSignedIn();
  if (!ctx.ok) return { error: ctx.error };

  await db().collection(COLLECTIONS.profiles).doc(ctx.profile.id).set(
    {
      photo_url: null,
      updated_at: nowIso(),
    },
    { merge: true },
  );

  if (ctx.profile.role === "tutor" || ctx.profile.role === "tutor_applicant") {
    await syncListingPhoto(ctx.profile.id, null);
  }

  revalidateAccountSurfaces(ctx.profile.role);
  return {
    success: "Profile photo removed.",
    photoUrl: null,
  };
}
