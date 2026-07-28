"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import {
  BROWSE_SORT_OPTIONS,
  browseFiltersToSearchParams,
  countActiveFilters,
  type BrowseFilters,
  type BrowseSort,
} from "@/domain/browse-filters";
import {
  LISTING_GENDER_OPTIONS,
  RATE_MAX_USD,
  RATE_MIN_USD,
  SUBJECT_OPTIONS,
  type ListingGender,
  type ListingSubject,
} from "@/domain/tutor-listings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Props = {
  initial: BrowseFilters;
};

function readFiltersFromForm(form: HTMLFormElement): BrowseFilters {
  const fd = new FormData(form);
  const subjects = fd
    .getAll("subject")
    .map(String)
    .filter(Boolean) as ListingSubject[];
  const genderRaw = String(fd.get("gender") ?? "");
  const sortRaw = String(fd.get("sort") ?? "newest") as BrowseSort;

  const priceMinRaw = String(fd.get("priceMin") ?? "").trim();
  const priceMaxRaw = String(fd.get("priceMax") ?? "").trim();
  const minRatingRaw = String(fd.get("minRating") ?? "").trim();

  return {
    gender: genderRaw
      ? (genderRaw as ListingGender)
      : null,
    subjects,
    language: String(fd.get("language") ?? "").trim(),
    childrenOnly: fd.get("children") === "1",
    priceMin: priceMinRaw ? Number(priceMinRaw) : null,
    priceMax: priceMaxRaw ? Number(priceMaxRaw) : null,
    availability: String(fd.get("availability") ?? "").trim(),
    minRating: minRatingRaw ? Number(minRatingRaw) : null,
    sort: sortRaw,
    q: String(fd.get("q") ?? "").trim(),
  };
}

function FilterFields({
  filters,
  idPrefix,
}: {
  filters: BrowseFilters;
  idPrefix: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor={`${idPrefix}-q`}
          className="block text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]"
        >
          Search
        </label>
        <input
          id={`${idPrefix}-q`}
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Tajweed, Hifz, Urdu…"
          className="mt-1.5 w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 text-sm shadow-[var(--shadow-xs)] transition-[border-color,box-shadow] focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-focus)] focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}-sort`}
          className="block text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]"
        >
          Sort
        </label>
        <select
          id={`${idPrefix}-sort`}
          name="sort"
          defaultValue={filters.sort}
          className="mt-1.5 w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 text-sm shadow-[var(--shadow-xs)]"
        >
          {BROWSE_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
          Gender
        </legend>
        <div className="mt-2 flex flex-wrap gap-3">
          <label className="inline-flex min-h-11 items-center gap-2 text-sm">
            <input
              type="radio"
              name="gender"
              value=""
              defaultChecked={!filters.gender}
              className="size-4 accent-[var(--color-primary)]"
            />
            Any
          </label>
          {LISTING_GENDER_OPTIONS.map((g) => (
            <label
              key={g.value}
              className="inline-flex min-h-11 items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="gender"
                value={g.value}
                defaultChecked={filters.gender === g.value}
                className="size-4 accent-[var(--color-primary)]"
              />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
          Subjects
        </legend>
        <div className="mt-2 grid gap-2">
          {SUBJECT_OPTIONS.map((subject) => (
            <label
              key={subject.value}
              className="flex min-h-11 items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                name="subject"
                value={subject.value}
                defaultChecked={filters.subjects.includes(subject.value)}
                className="size-4 accent-[var(--color-primary)]"
              />
              {subject.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor={`${idPrefix}-language`}
          className="block text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]"
        >
          Languages
        </label>
        <input
          id={`${idPrefix}-language`}
          name="language"
          defaultValue={filters.language}
          placeholder="e.g. English, Urdu"
          className="mt-1.5 w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 text-sm"
        />
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="children"
          value="1"
          defaultChecked={filters.childrenOnly}
          className="size-4 accent-[var(--color-primary)]"
        />
        Experience with children
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`${idPrefix}-priceMin`}
            className="block text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]"
          >
            Min $
          </label>
          <input
            id={`${idPrefix}-priceMin`}
            name="priceMin"
            type="number"
            min={RATE_MIN_USD}
            max={RATE_MAX_USD}
            step="1"
            defaultValue={filters.priceMin ?? ""}
            placeholder={String(RATE_MIN_USD)}
            className="mt-1.5 w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-priceMax`}
            className="block text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]"
          >
            Max $
          </label>
          <input
            id={`${idPrefix}-priceMax`}
            name="priceMax"
            type="number"
            min={RATE_MIN_USD}
            max={RATE_MAX_USD}
            step="1"
            defaultValue={filters.priceMax ?? ""}
            placeholder={String(RATE_MAX_USD)}
            className="mt-1.5 w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 text-sm"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-availability`}
          className="block text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]"
        >
          Availability / timezone
        </label>
        <input
          id={`${idPrefix}-availability`}
          name="availability"
          defaultValue={filters.availability}
          placeholder="e.g. evening, weekend, EST, GMT"
          className="mt-1.5 w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 text-sm"
        />
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-minRating`}
          className="block text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]"
        >
          Minimum rating
        </label>
        <select
          id={`${idPrefix}-minRating`}
          name="minRating"
          defaultValue={filters.minRating ?? ""}
          className="mt-1.5 w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-3 text-sm"
        >
          <option value="">Any</option>
          <option value="4">4.0+</option>
          <option value="4.5">4.5+</option>
          <option value="4.8">4.8+</option>
        </select>
      </div>
    </div>
  );
}

export function BrowseFiltersPanel({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const titleId = useId();
  const activeCount = countActiveFilters(initial);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  function applyFromForm(form: HTMLFormElement) {
    const next = readFiltersFromForm(form);
    const qs = browseFiltersToSearchParams(next).toString();
    startTransition(() => {
      router.push(qs ? `/browse?${qs}` : "/browse");
      setSheetOpen(false);
    });
  }

  function clearAll() {
    startTransition(() => {
      router.push("/browse");
      setSheetOpen(false);
    });
  }

  return (
    <>
      {/* Desktop filter bar */}
      <aside className="hidden md:block">
        <form
          className="space-y-5 border-b border-[var(--color-outline)] pb-6 md:border-b-0 md:pb-0"
          onSubmit={(e) => {
            e.preventDefault();
            applyFromForm(e.currentTarget);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-medium">
              Filters
            </h2>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
              >
                Clear all
              </button>
            ) : null}
          </div>
          <FilterFields filters={initial} idPrefix="desk" />
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Updating…" : "Apply filters"}
          </Button>
        </form>
      </aside>

      {/* Mobile trigger */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            "inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-outline-strong)] px-4 text-xs font-semibold tracking-[0.04em] text-[var(--color-primary)]",
            "hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
          )}
        >
          Filters
          {activeCount > 0 ? (
            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] text-[var(--color-on-primary)]">
              {activeCount}
            </span>
          ) : null}
        </button>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>

      {/* Mobile filter sheet */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal aria-labelledby={titleId}>
          <button
            type="button"
            className="absolute inset-0 bg-[var(--color-on-background)]/40"
            aria-label="Close filters"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 pb-8 pt-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id={titleId}
                className="font-[family-name:var(--font-fraunces)] text-xl font-medium"
              >
                Filters
                {activeCount > 0 ? ` (${activeCount})` : ""}
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="min-h-11 px-2 text-sm font-semibold text-[var(--color-primary)]"
              >
                Close
              </button>
            </div>
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                applyFromForm(e.currentTarget);
              }}
            >
              <FilterFields filters={initial} idPrefix="mobile" />
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={clearAll}
                >
                  Clear
                </Button>
                <Button type="submit" disabled={pending} className="flex-1">
                  {pending ? "Updating…" : "Show results"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
