import {
  LISTING_GENDER_OPTIONS,
  RATE_MAX_USD,
  RATE_MIN_USD,
  SUBJECT_OPTIONS,
  subjectLabel,
  type ListingGender,
  type ListingSubject,
  type TutorListing,
} from "@/domain/tutor-listings";

export const BROWSE_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

export type BrowseSort = (typeof BROWSE_SORT_OPTIONS)[number]["value"];

export type BrowseFilters = {
  q: string;
  gender: ListingGender | null;
  subjects: ListingSubject[];
  language: string;
  childrenOnly: boolean;
  priceMin: number | null;
  priceMax: number | null;
  availability: string;
  minRating: number | null;
  sort: BrowseSort;
};

export const EMPTY_BROWSE_FILTERS: BrowseFilters = {
  q: "",
  gender: null,
  subjects: [],
  language: "",
  childrenOnly: false,
  priceMin: null,
  priceMax: null,
  availability: "",
  minRating: null,
  sort: "newest",
};

const SUBJECT_VALUES = SUBJECT_OPTIONS.map((s) => s.value);
const GENDER_VALUES = LISTING_GENDER_OPTIONS.map((g) => g.value);
const SORT_VALUES = BROWSE_SORT_OPTIONS.map((s) => s.value);

function firstString(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function allStrings(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseNumber(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function parseBrowseFilters(
  params: Record<string, string | string[] | undefined>,
): BrowseFilters {
  const genderRaw = firstString(params.gender);
  const gender = GENDER_VALUES.includes(genderRaw as ListingGender)
    ? (genderRaw as ListingGender)
    : null;

  const subjects = allStrings(params.subject).filter((v): v is ListingSubject =>
    SUBJECT_VALUES.includes(v as ListingSubject),
  );

  const sortRaw = firstString(params.sort) || "newest";
  const sort = SORT_VALUES.includes(sortRaw as BrowseSort)
    ? (sortRaw as BrowseSort)
    : "newest";

  let priceMin = parseNumber(firstString(params.priceMin));
  let priceMax = parseNumber(firstString(params.priceMax));
  if (priceMin != null) {
    priceMin = Math.max(RATE_MIN_USD, Math.min(RATE_MAX_USD, priceMin));
  }
  if (priceMax != null) {
    priceMax = Math.max(RATE_MIN_USD, Math.min(RATE_MAX_USD, priceMax));
  }

  const minRating = parseNumber(firstString(params.minRating));

  return {
    q: firstString(params.q).trim(),
    gender,
    subjects,
    language: firstString(params.language).trim(),
    childrenOnly:
      firstString(params.children) === "1" ||
      firstString(params.children) === "true",
    priceMin,
    priceMax,
    availability: firstString(params.availability).trim(),
    minRating:
      minRating != null && minRating >= 1 && minRating <= 5 ? minRating : null,
    sort,
  };
}

export function countActiveFilters(filters: BrowseFilters): number {
  let n = 0;
  if (filters.q) n += 1;
  if (filters.gender) n += 1;
  if (filters.subjects.length) n += 1;
  if (filters.language) n += 1;
  if (filters.childrenOnly) n += 1;
  if (filters.priceMin != null) n += 1;
  if (filters.priceMax != null) n += 1;
  if (filters.availability) n += 1;
  if (filters.minRating != null) n += 1;
  return n;
}

export function browseFiltersToSearchParams(
  filters: BrowseFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.gender) params.set("gender", filters.gender);
  for (const subject of filters.subjects) {
    params.append("subject", subject);
  }
  if (filters.language) params.set("language", filters.language);
  if (filters.childrenOnly) params.set("children", "1");
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  if (filters.availability) params.set("availability", filters.availability);
  if (filters.minRating != null) {
    params.set("minRating", String(filters.minRating));
  }
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  return params;
}

function matchesLanguage(listing: TutorListing, needle: string): boolean {
  const hay = listing.languages.toLowerCase();
  return needle
    .toLowerCase()
    .split(/[,/]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .every((part) => hay.includes(part));
}

export function filterAndSortListings(
  listings: TutorListing[],
  filters: BrowseFilters,
): TutorListing[] {
  let result = listings.filter((listing) => {
    if (!listing.published) return false;
    if (filters.q) {
      const needle = filters.q.toLowerCase();
      const hay = [
        listing.headline,
        listing.bio,
        listing.languages,
        listing.subjects.map(subjectLabel).join(" "),
        listing.availability_summary,
        listing.qualifications ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (filters.gender && listing.gender !== filters.gender) return false;
    if (
      filters.subjects.length > 0 &&
      !filters.subjects.every((s) => listing.subjects.includes(s))
    ) {
      return false;
    }
    if (filters.language && !matchesLanguage(listing, filters.language)) {
      return false;
    }
    if (
      filters.childrenOnly &&
      !listing.child_experience_summary?.trim()
    ) {
      return false;
    }
    if (
      filters.priceMin != null &&
      (listing.rate_usd == null || listing.rate_usd < filters.priceMin)
    ) {
      return false;
    }
    if (
      filters.priceMax != null &&
      (listing.rate_usd == null || listing.rate_usd > filters.priceMax)
    ) {
      return false;
    }
    if (filters.availability) {
      const hay = listing.availability_summary.toLowerCase();
      if (!hay.includes(filters.availability.toLowerCase())) return false;
    }
    if (filters.minRating != null) {
      const rating = listing.rating_avg;
      if (rating == null || rating < filters.minRating) return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case "rating": {
        const ra = a.rating_avg ?? -1;
        const rb = b.rating_avg ?? -1;
        return rb - ra;
      }
      case "price_asc": {
        return (a.rate_usd ?? Number.POSITIVE_INFINITY) -
          (b.rate_usd ?? Number.POSITIVE_INFINITY);
      }
      case "price_desc": {
        return (b.rate_usd ?? -1) - (a.rate_usd ?? -1);
      }
      case "newest":
      default: {
        const ta = a.published_at ?? a.created_at;
        const tb = b.published_at ?? b.created_at;
        return tb.localeCompare(ta);
      }
    }
  });

  return result;
}
