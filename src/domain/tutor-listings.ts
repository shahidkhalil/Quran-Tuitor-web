export const SUBJECT_OPTIONS = [
  { value: "quran_reading", label: "Qur’an reading" },
  { value: "tajweed", label: "Tajweed" },
  { value: "hifz", label: "Hifz / memorisation" },
  { value: "arabic", label: "Arabic" },
  { value: "islamic_studies", label: "Islamic studies" },
] as const;

export type ListingSubject = (typeof SUBJECT_OPTIONS)[number]["value"];

export const LISTING_GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

export type ListingGender = (typeof LISTING_GENDER_OPTIONS)[number]["value"];

/** USD per lesson — global marketplace guardrails */
export const LISTING_CURRENCY = "USD" as const;
export const RATE_MIN_USD = 10;
export const RATE_MAX_USD = 50;

/** @deprecated Use RATE_MIN_USD */
export const RATE_MIN_GBP = RATE_MIN_USD;
/** @deprecated Use RATE_MAX_USD */
export const RATE_MAX_GBP = RATE_MAX_USD;

export type ListingReview = {
  id: string;
  author_display: string;
  rating: number;
  body: string;
  created_at: string;
};

export type TutorListing = {
  id: string;
  tutor_id: string;
  headline: string;
  bio: string;
  subjects: ListingSubject[];
  languages: string;
  gender: ListingGender | null;
  /** Lesson rate in USD */
  rate_usd: number | null;
  currency: typeof LISTING_CURRENCY;
  availability_summary: string;
  child_experience_summary: string;
  /** Credentials / Ijazah summary shown on public profile (FR7) */
  qualifications: string;
  /** Years of teaching experience */
  years_teaching: number | null;
  /** Teaching base / country of residence */
  country: string;
  /** IANA timezone for scheduling fit */
  timezone: string;
  /** Child age bands the tutor teaches */
  age_bands: ListingAgeBand[];
  /** Public profile photo (HTTPS). Optional — profile uses a placeholder when empty. */
  photo_url?: string | null;
  intro_video_url?: string | null;
  rating_avg?: number | null;
  review_count?: number;
  reviews?: ListingReview[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export const LISTING_AGE_BANDS = [
  { value: "4-6", label: "Ages 4–6" },
  { value: "7-9", label: "Ages 7–9" },
  { value: "10-12", label: "Ages 10–12" },
  { value: "13-16", label: "Ages 13–16" },
  { value: "adult", label: "Adults" },
] as const;

export type ListingAgeBand = (typeof LISTING_AGE_BANDS)[number]["value"];

export const COMMON_TIMEZONES = [
  "Europe/London",
  "Europe/Dublin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Africa/Cairo",
  "Asia/Jakarta",
  "Asia/Kuala_Lumpur",
  "UTC",
] as const;

export function ageBandLabel(value: string): string {
  return LISTING_AGE_BANDS.find((b) => b.value === value)?.label ?? value;
}

export function timezoneLabel(tz: string): string {
  if (!tz) return "";
  return tz.replace(/_/g, " ");
}

/** Raw Firestore shape may still carry legacy `rate_gbp`. */
type ListingDoc = Partial<TutorListing> & {
  rate_gbp?: number | null;
};

export function normalizeListing(raw: ListingDoc): TutorListing {
  const rate =
    raw.rate_usd ??
    (typeof raw.rate_gbp === "number" ? raw.rate_gbp : null) ??
    null;

  const ageBands = Array.isArray(raw.age_bands)
    ? raw.age_bands.filter((v): v is ListingAgeBand =>
        LISTING_AGE_BANDS.some((b) => b.value === v),
      )
    : [];

  const years =
    typeof raw.years_teaching === "number" && Number.isFinite(raw.years_teaching)
      ? Math.max(0, Math.min(60, Math.floor(raw.years_teaching)))
      : null;

  return {
    id: String(raw.id ?? ""),
    tutor_id: String(raw.tutor_id ?? raw.id ?? ""),
    headline: raw.headline ?? "",
    bio: raw.bio ?? "",
    subjects: raw.subjects ?? [],
    languages: raw.languages ?? "",
    gender: raw.gender ?? null,
    rate_usd: rate,
    currency: LISTING_CURRENCY,
    availability_summary: raw.availability_summary ?? "",
    child_experience_summary: raw.child_experience_summary ?? "",
    qualifications: raw.qualifications ?? "",
    years_teaching: years,
    country: raw.country ?? "",
    timezone: raw.timezone ?? "",
    age_bands: ageBands,
    photo_url: raw.photo_url ?? null,
    intro_video_url: raw.intro_video_url ?? null,
    rating_avg: raw.rating_avg ?? null,
    review_count: raw.review_count ?? 0,
    reviews: raw.reviews ?? [],
    published: Boolean(raw.published),
    published_at: raw.published_at ?? null,
    created_at: raw.created_at ?? "",
    updated_at: raw.updated_at ?? "",
  };
}

export function formatLessonRate(rateUsd: number | null | undefined): string {
  if (rateUsd == null) return "Rate TBC";
  return `$${rateUsd}`;
}

/** Initials for avatar placeholder when no photo. */
export function listingInitials(headline: string): string {
  const words = headline.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("") || "QT";
}

/** Display name from headline (first few words) for profile chrome. */
export function listingDisplayName(headline: string): string {
  const trimmed = headline.trim();
  if (!trimmed) return "Tutor";
  const words = trimmed.split(/\s+/);
  if (words.length <= 3) return trimmed;
  return words.slice(0, 2).join(" ");
}

export function subjectLabel(value: string): string {
  return SUBJECT_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

export function genderLabel(value: ListingGender | null | undefined): string {
  if (!value) return "";
  return LISTING_GENDER_OPTIONS.find((g) => g.value === value)?.label ?? value;
}

export type ListingField =
  | "headline"
  | "bio"
  | "subjects"
  | "languages"
  | "gender"
  | "rateUsd"
  | "availabilitySummary"
  | "childExperienceSummary"
  | "qualifications"
  | "yearsTeaching"
  | "country"
  | "timezone"
  | "ageBands";

export function missingPublishFields(listing: Partial<TutorListing>): ListingField[] {
  const missing: ListingField[] = [];
  if (!listing.headline?.trim()) missing.push("headline");
  if (!listing.bio?.trim()) missing.push("bio");
  if (!listing.subjects?.length) missing.push("subjects");
  if (!listing.languages?.trim()) missing.push("languages");
  if (!listing.gender) missing.push("gender");
  if (
    listing.rate_usd == null ||
    listing.rate_usd < RATE_MIN_USD ||
    listing.rate_usd > RATE_MAX_USD
  ) {
    missing.push("rateUsd");
  }
  if (!listing.availability_summary?.trim()) missing.push("availabilitySummary");
  if (!listing.child_experience_summary?.trim()) {
    missing.push("childExperienceSummary");
  }
  if (!listing.qualifications?.trim()) missing.push("qualifications");
  if (listing.years_teaching == null) missing.push("yearsTeaching");
  if (!listing.country?.trim()) missing.push("country");
  if (!listing.timezone?.trim()) missing.push("timezone");
  if (!listing.age_bands?.length) missing.push("ageBands");
  return missing;
}

export function fieldLabel(field: ListingField): string {
  switch (field) {
    case "headline":
      return "Headline";
    case "bio":
      return "About you";
    case "subjects":
      return "Subjects";
    case "languages":
      return "Languages";
    case "gender":
      return "Gender";
    case "rateUsd":
      return `Rate ($${RATE_MIN_USD}–$${RATE_MAX_USD} per lesson)`;
    case "availabilitySummary":
      return "Availability";
    case "childExperienceSummary":
      return "Child teaching experience";
    case "qualifications":
      return "Qualifications";
    case "yearsTeaching":
      return "Years teaching";
    case "country":
      return "Country";
    case "timezone":
      return "Timezone";
    case "ageBands":
      return "Ages you teach";
  }
}
