"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { COLLECTIONS, db, nowIso } from "@/lib/firebase/db";
import {
  isCloudinaryConfigured,
  uploadFileToCloudinary,
} from "@/lib/cloudinary";
import { isAuthConfigured } from "@/lib/firebase/server-auth";
import { getCurrentProfile } from "@/server/services/profile";
import {
  canTutorAcceptNewBookings,
} from "@/domain/tutor-enforcement";
import {
  assertTutorCanAcceptNewBookings,
  getTutorEnforcement,
} from "@/server/actions/admin-enforcement";
import {
  COMMON_TIMEZONES,
  LISTING_AGE_BANDS,
  LISTING_CURRENCY,
  LISTING_GENDER_OPTIONS,
  RATE_MAX_USD,
  RATE_MIN_USD,
  SUBJECT_OPTIONS,
  fieldLabel,
  missingPublishFields,
  normalizeListing,
  type ListingAgeBand,
  type ListingField,
  type ListingGender,
  type ListingSubject,
  type TutorListing,
} from "@/domain/tutor-listings";

export type ListingFormState = {
  error?: string;
  fieldErrors?: Partial<Record<ListingField, string>>;
  success?: string;
  /** Echoed form values so the editor can restore input after a failed action. */
  values?: {
    headline: string;
    bio: string;
    languages: string;
    availabilitySummary: string;
    childExperienceSummary: string;
    qualifications: string;
    yearsTeaching: string;
    country: string;
    timezone: string;
    gender: string;
    rateUsd: string;
    photoUrl: string;
    introVideoUrl: string;
    subjects: ListingSubject[];
    ageBands: ListingAgeBand[];
  };
};

const SUBJECT_VALUES = SUBJECT_OPTIONS.map((s) => s.value);
const GENDER_VALUES = LISTING_GENDER_OPTIONS.map((g) => g.value);
const AGE_BAND_VALUES = LISTING_AGE_BANDS.map((b) => b.value);

async function requireVerifiedTutor() {
  if (!isAuthConfigured()) {
    return { ok: false as const, error: "Firebase is not configured." };
  }
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false as const, error: "Please sign in." };
  }
  if (profile.role !== "tutor") {
    return {
      ok: false as const,
      error:
        "Only approved tutors can edit a listing. Finish vetting first.",
    };
  }
  return { ok: true as const, profile };
}

function listingRef(tutorId: string) {
  return db().collection(COLLECTIONS.tutorListings).doc(tutorId);
}

export async function getMyListing(): Promise<{
  listing: TutorListing | null;
  error?: string;
}> {
  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) {
    return { listing: null, error: ctx.error };
  }

  const snap = await listingRef(ctx.profile.id).get();
  if (!snap.exists) return { listing: null };
  return { listing: normalizeListing(snap.data() as TutorListing) };
}

export async function listPublishedListings(): Promise<{
  listings: TutorListing[];
  error?: string;
}> {
  if (!isAuthConfigured()) {
    return { listings: [], error: "Firebase is not configured." };
  }
  try {
    const snap = await db()
      .collection(COLLECTIONS.tutorListings)
      .where("published", "==", true)
      .orderBy("published_at", "desc")
      .get();
    const raw = snap.docs.map((d) => normalizeListing(d.data() as TutorListing));
    const gated = await filterBookableListings(raw);
    return {
      listings: await enrichListingsWithProfilePhotos(gated),
    };
  } catch {
    try {
      const snap = await db()
        .collection(COLLECTIONS.tutorListings)
        .where("published", "==", true)
        .get();
      const raw = snap.docs.map((d) => normalizeListing(d.data() as TutorListing));
      const gated = await filterBookableListings(raw);
      return {
        listings: await enrichListingsWithProfilePhotos(gated),
      };
    } catch {
      return { listings: [], error: "Could not load listings." };
    }
  }
}

async function filterBookableListings(
  listings: TutorListing[],
): Promise<TutorListing[]> {
  const checks = await Promise.all(
    listings.map(async (l) => {
      const enf = await getTutorEnforcement(l.tutor_id);
      return canTutorAcceptNewBookings(enf.enforcement_status) ? l : null;
    }),
  );
  return checks.filter((l): l is TutorListing => l != null);
}

async function enrichListingsWithProfilePhotos(
  listings: TutorListing[],
): Promise<TutorListing[]> {
  const needPhoto = listings.filter((l) => !l.photo_url);
  if (needPhoto.length === 0) return listings;

  const photos = new Map<string, string | null>();
  await Promise.all(
    needPhoto.map(async (l) => {
      const snap = await db()
        .collection(COLLECTIONS.profiles)
        .doc(l.tutor_id)
        .get();
      photos.set(
        l.tutor_id,
        (snap.data()?.photo_url as string | null | undefined) ?? null,
      );
    }),
  );

  return listings.map((l) => {
    if (l.photo_url) return l;
    const fallback = photos.get(l.tutor_id);
    return fallback ? { ...l, photo_url: fallback } : l;
  });
}

/** Public read — only returns published listings (unpublished → null). */
export async function getPublishedListingById(
  id: string,
): Promise<{ listing: TutorListing | null; error?: string }> {
  if (!isAuthConfigured()) {
    return { listing: null, error: "Firebase is not configured." };
  }
  if (!id?.trim()) return { listing: null };

  try {
    const snap = await listingRef(id.trim()).get();
    if (!snap.exists) return { listing: null };
    const listing = normalizeListing(snap.data() as TutorListing);
    if (!listing.published) return { listing: null };
    const enf = await getTutorEnforcement(listing.tutor_id);
    if (!canTutorAcceptNewBookings(enf.enforcement_status)) {
      return { listing: null };
    }
    if (!listing.photo_url) {
      const [enriched] = await enrichListingsWithProfilePhotos([listing]);
      return { listing: enriched ?? listing };
    }
    return { listing };
  } catch {
    return { listing: null, error: "Could not load listing." };
  }
}

function parseSubjects(formData: FormData): ListingSubject[] {
  const raw = formData.getAll("subjects").map(String);
  return raw.filter((v): v is ListingSubject =>
    SUBJECT_VALUES.includes(v as ListingSubject),
  );
}

function parseAgeBands(formData: FormData): ListingAgeBand[] {
  const raw = formData.getAll("ageBands").map(String);
  return raw.filter((v): v is ListingAgeBand =>
    AGE_BAND_VALUES.includes(v as ListingAgeBand),
  );
}

function parseListingInput(formData: FormData): {
  data: Partial<TutorListing>;
  values: NonNullable<ListingFormState["values"]>;
  fieldErrors: Partial<Record<ListingField, string>>;
} {
  const fieldErrors: Partial<Record<ListingField, string>> = {};
  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const languages = String(formData.get("languages") ?? "").trim();
  const availabilitySummary = String(
    formData.get("availabilitySummary") ?? "",
  ).trim();
  const childExperienceSummary = String(
    formData.get("childExperienceSummary") ?? "",
  ).trim();
  const qualifications = String(formData.get("qualifications") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const timezoneRaw = String(formData.get("timezone") ?? "").trim();
  const yearsRaw = String(formData.get("yearsTeaching") ?? "").trim();
  const genderRaw = String(formData.get("gender") ?? "").trim();
  const rateRaw = String(
    formData.get("rateUsd") ?? formData.get("rateGbp") ?? "",
  ).trim();
  const introVideoUrl = String(formData.get("introVideoUrl") ?? "").trim();
  const subjects = parseSubjects(formData);
  const ageBands = parseAgeBands(formData);

  const gender = GENDER_VALUES.includes(genderRaw as ListingGender)
    ? (genderRaw as ListingGender)
    : null;

  const timezone =
    timezoneRaw &&
    (COMMON_TIMEZONES as readonly string[]).includes(timezoneRaw)
      ? timezoneRaw
      : timezoneRaw;

  let yearsTeaching: number | null = null;
  if (yearsRaw) {
    const n = Number(yearsRaw);
    if (!Number.isFinite(n) || n < 0 || n > 60) {
      fieldErrors.yearsTeaching = "Enter years teaching between 0 and 60.";
    } else {
      yearsTeaching = Math.floor(n);
    }
  }

  let rateUsd: number | null = null;
  if (rateRaw) {
    const n = Number(rateRaw);
    if (!Number.isFinite(n)) {
      fieldErrors.rateUsd = "Enter a valid rate in USD.";
    } else {
      rateUsd = Math.round(n * 100) / 100;
      if (rateUsd < RATE_MIN_USD || rateUsd > RATE_MAX_USD) {
        fieldErrors.rateUsd = `Rate must be between $${RATE_MIN_USD} and $${RATE_MAX_USD}.`;
      }
    }
  }

  const values: NonNullable<ListingFormState["values"]> = {
    headline,
    bio,
    languages,
    availabilitySummary,
    childExperienceSummary,
    qualifications,
    yearsTeaching: yearsRaw,
    country,
    timezone,
    gender: genderRaw,
    rateUsd: rateRaw,
    photoUrl: "",
    introVideoUrl,
    subjects,
    ageBands,
  };

  return {
    fieldErrors,
    values,
    data: {
      headline,
      bio,
      languages,
      availability_summary: availabilitySummary,
      child_experience_summary: childExperienceSummary,
      qualifications,
      years_teaching: yearsTeaching,
      country,
      timezone,
      age_bands: ageBands,
      gender,
      rate_usd: rateUsd,
      currency: LISTING_CURRENCY,
      subjects,
      intro_video_url: introVideoUrl || null,
    },
  };
}

async function seedFromApplication(
  tutorId: string,
  data: Partial<TutorListing>,
): Promise<Partial<TutorListing>> {
  try {
    const snap = await db()
      .collection(COLLECTIONS.tutorApplications)
      .where("applicant_id", "==", tutorId)
      .limit(1)
      .get();
    const app = snap.docs[0]?.data() as
      | {
          credentials_summary?: string;
          years_teaching?: number | null;
          country?: string;
          languages?: string;
        }
      | undefined;
    if (!app) return data;
    return {
      ...data,
      qualifications:
        data.qualifications?.trim() ||
        app.credentials_summary?.trim() ||
        data.qualifications,
      years_teaching:
        data.years_teaching != null
          ? data.years_teaching
          : typeof app.years_teaching === "number"
            ? app.years_teaching
            : data.years_teaching,
      country: data.country?.trim() || app.country?.trim() || data.country,
      languages: data.languages?.trim() || app.languages?.trim() || data.languages,
    };
  } catch {
    return data;
  }
}

async function saveListingPayload(
  tutorId: string,
  data: Partial<TutorListing>,
  opts: { publish: boolean },
): Promise<{ listing: TutorListing }> {
  const ref = listingRef(tutorId);
  const existing = await ref.get();
  const prev = existing.exists
    ? normalizeListing(existing.data() as TutorListing)
    : null;
  const stamp = nowIso();
  const published = opts.publish ? true : (prev?.published ?? false);

  let merged = data;
  if (!prev) {
    merged = await seedFromApplication(tutorId, data);
  }

  const listing: TutorListing = {
    id: tutorId,
    tutor_id: tutorId,
    headline: merged.headline ?? prev?.headline ?? "",
    bio: merged.bio ?? prev?.bio ?? "",
    subjects: merged.subjects ?? prev?.subjects ?? [],
    languages: merged.languages ?? prev?.languages ?? "",
    gender: merged.gender ?? prev?.gender ?? null,
    rate_usd: merged.rate_usd ?? prev?.rate_usd ?? null,
    currency: LISTING_CURRENCY,
    availability_summary:
      merged.availability_summary ?? prev?.availability_summary ?? "",
    child_experience_summary:
      merged.child_experience_summary ?? prev?.child_experience_summary ?? "",
    qualifications: merged.qualifications ?? prev?.qualifications ?? "",
    years_teaching:
      merged.years_teaching !== undefined
        ? merged.years_teaching
        : (prev?.years_teaching ?? null),
    country: merged.country ?? prev?.country ?? "",
    timezone: merged.timezone ?? prev?.timezone ?? "",
    age_bands: merged.age_bands ?? prev?.age_bands ?? [],
    photo_url:
      merged.photo_url !== undefined
        ? merged.photo_url
        : (prev?.photo_url ?? null),
    intro_video_url:
      merged.intro_video_url !== undefined
        ? merged.intro_video_url
        : (prev?.intro_video_url ?? null),
    rating_avg: prev?.rating_avg ?? null,
    review_count: prev?.review_count ?? 0,
    reviews: prev?.reviews ?? [],
    published,
    published_at: published ? prev?.published_at ?? stamp : null,
    created_at: prev?.created_at ?? stamp,
    updated_at: stamp,
  };

  if (published && !opts.publish) {
    const missing = missingPublishFields(listing);
    if (missing.length > 0) {
      listing.published = false;
      listing.published_at = null;
    }
  }

  await ref.set(listing);
  return { listing };
}

async function maybeUploadListingPhoto(
  formData: FormData,
  data: Partial<TutorListing>,
): Promise<{ data: Partial<TutorListing>; error?: string }> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { data };
  }
  if (!file.type.startsWith("image/")) {
    return { data, error: "Profile photo must be an image (JPG, PNG, or WebP)." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { data, error: "Profile photo must be 5 MB or smaller." };
  }
  if (!isCloudinaryConfigured()) {
    return {
      data,
      error: "Photo upload is not configured. Try again later.",
    };
  }
  try {
    const uploaded = await uploadFileToCloudinary(file, "listing-photos");
    return { data: { ...data, photo_url: uploaded.url } };
  } catch (err) {
    console.error("[listing photo]", err);
    return { data, error: "Could not upload photo. Try again." };
  }
}

export async function saveListingDraft(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) return { error: ctx.error };

  const parsed = parseListingInput(formData);
  if (Object.keys(parsed.fieldErrors).length > 0) {
    return {
      values: parsed.values,
      fieldErrors: parsed.fieldErrors,
      error: "Please fix the highlighted fields.",
    };
  }

  const uploaded = await maybeUploadListingPhoto(formData, parsed.data);
  if (uploaded.error) {
    return { values: parsed.values, error: uploaded.error };
  }

  const saved = await saveListingPayload(ctx.profile.id, uploaded.data, {
    publish: false,
  });
  const nextValues = {
    ...parsed.values,
    photoUrl: saved.listing.photo_url ?? "",
  };

  revalidatePath("/tutor");
  revalidatePath("/tutor/listing");
  revalidatePath("/browse");
  revalidatePath(`/browse/${ctx.profile.id}`);
  return {
    values: nextValues,
    success: "Draft saved. Publish when all required fields are complete.",
  };
}

export async function publishListing(
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) return { error: ctx.error };

  const gate = await assertTutorCanAcceptNewBookings(ctx.profile.id);
  if (!gate.ok) {
    return {
      error:
        gate.error ||
        "Your account cannot publish while suspended or unlisted.",
    };
  }

  const parsed = parseListingInput(formData);
  if (Object.keys(parsed.fieldErrors).length > 0) {
    return {
      values: parsed.values,
      fieldErrors: parsed.fieldErrors,
      error: "Please fix the highlighted fields.",
    };
  }

  const uploaded = await maybeUploadListingPhoto(formData, parsed.data);
  if (uploaded.error) {
    return { values: parsed.values, error: uploaded.error };
  }

  const existingSnap = await listingRef(ctx.profile.id).get();
  const existingPhoto =
    existingSnap.exists
      ? ((existingSnap.data()?.photo_url as string | null | undefined) ?? null)
      : null;
  const nextValues = {
    ...parsed.values,
    photoUrl: uploaded.data.photo_url ?? existingPhoto ?? "",
  };

  const missing = missingPublishFields(uploaded.data);
  if (missing.length > 0) {
    const errors: Partial<Record<ListingField, string>> = {};
    for (const field of missing) {
      errors[field] = `${fieldLabel(field)} is required to publish.`;
    }
    return {
      values: nextValues,
      fieldErrors: errors,
      error: `Complete required fields before publishing: ${missing.map(fieldLabel).join(", ")}.`,
    };
  }

  await saveListingPayload(ctx.profile.id, uploaded.data, { publish: true });
  revalidatePath("/tutor");
  revalidatePath("/tutor/listing");
  revalidatePath("/browse");
  revalidatePath(`/browse/${ctx.profile.id}`);
  redirect("/tutor/listing?published=1");
}

export async function unpublishListing() {
  const ctx = await requireVerifiedTutor();
  if (!ctx.ok) {
    redirect("/sign-in?next=/tutor/listing");
  }

  const ref = listingRef(ctx.profile.id);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.set(
      {
        published: false,
        published_at: null,
        updated_at: nowIso(),
      },
      { merge: true },
    );
  }

  revalidatePath("/tutor");
  revalidatePath("/tutor/listing");
  revalidatePath("/browse");
  revalidatePath(`/browse/${ctx.profile.id}`);
  redirect("/tutor/listing?unpublished=1");
}
