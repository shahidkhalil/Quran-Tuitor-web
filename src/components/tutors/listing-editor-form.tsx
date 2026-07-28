"use client";

import { useActionState, useMemo } from "react";
import {
  COMMON_TIMEZONES,
  LISTING_AGE_BANDS,
  LISTING_GENDER_OPTIONS,
  RATE_MAX_USD,
  RATE_MIN_USD,
  SUBJECT_OPTIONS,
  type ListingAgeBand,
  type ListingSubject,
  type TutorListing,
} from "@/domain/tutor-listings";
import {
  publishListing,
  saveListingDraft,
  unpublishListing,
  type ListingFormState,
} from "@/server/actions/tutor-listings";

type Props = {
  listing: TutorListing | null;
};

type FormValues = NonNullable<ListingFormState["values"]>;

const initial: ListingFormState = {};

const fieldClass =
  "mt-1.5 w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]";

const areaClass =
  "mt-1.5 w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]";

function valuesFromListing(listing: TutorListing | null): FormValues {
  return {
    headline: listing?.headline ?? "",
    bio: listing?.bio ?? "",
    languages: listing?.languages ?? "",
    availabilitySummary: listing?.availability_summary ?? "",
    childExperienceSummary: listing?.child_experience_summary ?? "",
    qualifications: listing?.qualifications ?? "",
    yearsTeaching:
      listing?.years_teaching != null ? String(listing.years_teaching) : "",
    country: listing?.country ?? "",
    timezone: listing?.timezone ?? "",
    gender: listing?.gender ?? "",
    rateUsd:
      listing?.rate_usd != null && Number.isFinite(listing.rate_usd)
        ? String(listing.rate_usd)
        : "",
    photoUrl: listing?.photo_url ?? "",
    introVideoUrl: listing?.intro_video_url ?? "",
    subjects: (listing?.subjects ?? []) as ListingSubject[],
    ageBands: (listing?.age_bands ?? []) as ListingAgeBand[],
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-[var(--color-error)]" role="alert">
      {message}
    </p>
  );
}

export function ListingEditorForm({ listing }: Props) {
  const [draftState, draftAction, draftPending] = useActionState(
    saveListingDraft,
    initial,
  );
  const [publishState, publishAction, publishPending] = useActionState(
    publishListing,
    initial,
  );

  const state =
    publishState.error || publishState.fieldErrors || publishState.values
      ? publishState
      : draftState;
  const pending = draftPending || publishPending;

  const values = useMemo(
    () => state.values ?? valuesFromListing(listing),
    [state.values, listing],
  );

  const formKey = state.values
    ? `echo-${values.headline}-${values.subjects.join(",")}-${values.rateUsd}`
    : `saved-${listing?.updated_at ?? "new"}`;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-outline)] shadow-[var(--shadow-md)]">
        <div className="account-hero-band px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
                Public listing
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl text-white sm:text-3xl">
                {values.headline?.trim() || "Your tutor profile"}
              </h2>
              <p className="mt-2 max-w-lg text-sm text-white/75">
                Families see this on Browse. Complete every section before
                publishing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  listing?.published
                    ? "status-pill status-pill-success"
                    : "status-pill status-pill-neutral"
                }
              >
                {listing?.published ? "Published" : "Draft"}
              </span>
              {listing?.published ? (
                <form action={unpublishListing}>
                  <button
                    type="submit"
                    className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                  >
                    Unpublish
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <form
        key={formKey}
        className="space-y-4"
      >
        {state.error ? (
          <p
            role="alert"
            className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_8%,white)] px-4 py-3 text-sm text-[var(--color-error)]"
          >
            {state.error}
          </p>
        ) : null}
        {draftState.success && !publishState.error ? (
          <p
            role="status"
            className="rounded-[var(--radius-md)] border border-[var(--color-success)]/30 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-success)]"
          >
            {draftState.success}
          </p>
        ) : null}

        <section className="application-form-section space-y-4">
          <div>
            <p className="eyebrow text-[var(--color-accent)]">Media</p>
            <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
              Photo & intro
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="shrink-0">
              {values.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={values.photoUrl}
                  alt="Current listing photo"
                  className="size-28 rounded-[1.25rem] object-cover shadow-[var(--shadow-sm)] ring-2 ring-[var(--color-outline)]"
                />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(145deg,var(--color-primary),#1a6b52)] text-2xl font-bold text-white shadow-[var(--shadow-sm)]">
                  ?
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <label htmlFor="photo" className="text-sm font-semibold">
                  Profile photo
                </label>
                <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
                  Shown large on your public profile. JPG/PNG/WebP, max 5 MB.
                </p>
                <input
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-2 block w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-outline-strong)]/40 bg-[var(--color-surface-elevated)] px-3 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
              </div>
              <div>
                <label htmlFor="introVideoUrl" className="text-sm font-semibold">
                  Intro video URL (optional)
                </label>
                <input
                  id="introVideoUrl"
                  name="introVideoUrl"
                  defaultValue={values.introVideoUrl}
                  placeholder="YouTube or Drive link"
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="application-form-section space-y-4">
          <div>
            <p className="eyebrow text-[var(--color-accent)]">Story</p>
            <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
              How you teach
            </p>
          </div>
          <div>
            <label htmlFor="headline" className="text-sm font-semibold">
              Headline
            </label>
            <input
              id="headline"
              name="headline"
              defaultValue={values.headline}
              maxLength={120}
              placeholder="e.g. Patient Tajweed tutor for primary-age children"
              className={fieldClass}
            />
            <FieldError message={state.fieldErrors?.headline} />
          </div>
          <div>
            <label htmlFor="bio" className="text-sm font-semibold">
              About you
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={5}
              defaultValue={values.bio}
              placeholder="Share your teaching approach, qualifications, and who you work best with."
              className={areaClass}
            />
            <FieldError message={state.fieldErrors?.bio} />
          </div>
          <div>
            <label htmlFor="qualifications" className="text-sm font-semibold">
              Qualifications
            </label>
            <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
              Ijazah, Tajweed certificates, institution training — parents look
              for this first.
            </p>
            <textarea
              id="qualifications"
              name="qualifications"
              rows={3}
              defaultValue={values.qualifications}
              placeholder="e.g. Hafiz with Ijazah in Hafs; Tajweed diploma from …"
              className={areaClass}
            />
            <FieldError message={state.fieldErrors?.qualifications} />
          </div>
          <div>
            <label
              htmlFor="childExperienceSummary"
              className="text-sm font-semibold"
            >
              Child teaching experience
            </label>
            <textarea
              id="childExperienceSummary"
              name="childExperienceSummary"
              rows={3}
              defaultValue={values.childExperienceSummary}
              placeholder="Ages you’ve taught, classroom or 1:1 experience, safeguarding approach."
              className={areaClass}
            />
            <FieldError message={state.fieldErrors?.childExperienceSummary} />
          </div>
        </section>

        <section className="application-form-section space-y-4">
          <div>
            <p className="eyebrow text-[var(--color-accent)]">Trust details</p>
            <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
              Experience & location
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="yearsTeaching" className="text-sm font-semibold">
                Years teaching
              </label>
              <input
                id="yearsTeaching"
                name="yearsTeaching"
                type="number"
                min={0}
                max={60}
                defaultValue={values.yearsTeaching}
                placeholder="e.g. 5"
                className={fieldClass}
              />
              <FieldError message={state.fieldErrors?.yearsTeaching} />
            </div>
            <div>
              <label htmlFor="country" className="text-sm font-semibold">
                Country / teaching base
              </label>
              <input
                id="country"
                name="country"
                defaultValue={values.country}
                placeholder="e.g. Pakistan, Egypt, UK"
                className={fieldClass}
              />
              <FieldError message={state.fieldErrors?.country} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="timezone" className="text-sm font-semibold">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={values.timezone}
                className={fieldClass}
              >
                <option value="">Select timezone…</option>
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors?.timezone} />
            </div>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Ages you teach</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {LISTING_AGE_BANDS.map((band) => (
                <label
                  key={band.value}
                  className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 text-sm transition hover:border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-outline))]"
                >
                  <input
                    type="checkbox"
                    name="ageBands"
                    value={band.value}
                    defaultChecked={values.ageBands.includes(band.value)}
                    className="size-4 accent-[var(--color-primary)]"
                  />
                  {band.label}
                </label>
              ))}
            </div>
            <FieldError message={state.fieldErrors?.ageBands} />
          </fieldset>
        </section>

        <section className="application-form-section space-y-4">
          <div>
            <p className="eyebrow text-[var(--color-accent)]">Matching</p>
            <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
              Subjects & languages
            </p>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Subjects</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {SUBJECT_OPTIONS.map((subject) => (
                <label
                  key={subject.value}
                  className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 text-sm transition hover:border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-outline))]"
                >
                  <input
                    type="checkbox"
                    name="subjects"
                    value={subject.value}
                    defaultChecked={values.subjects.includes(subject.value)}
                    className="size-4 accent-[var(--color-primary)]"
                  />
                  {subject.label}
                </label>
              ))}
            </div>
            <FieldError message={state.fieldErrors?.subjects} />
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="languages" className="text-sm font-semibold">
                Languages
              </label>
              <input
                id="languages"
                name="languages"
                defaultValue={values.languages}
                placeholder="e.g. English, Urdu, Arabic"
                className={fieldClass}
              />
              <FieldError message={state.fieldErrors?.languages} />
            </div>
            <div>
              <label htmlFor="gender" className="text-sm font-semibold">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                defaultValue={values.gender}
                className={fieldClass}
              >
                <option value="">Select…</option>
                {LISTING_GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors?.gender} />
            </div>
          </div>
        </section>

        <section className="application-form-section space-y-4">
          <div>
            <p className="eyebrow text-[var(--color-accent)]">Schedule & rate</p>
            <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
              Availability & pricing
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_1fr]">
            <div>
              <label htmlFor="rateUsd" className="text-sm font-semibold">
                Rate / lesson (USD)
              </label>
              <input
                id="rateUsd"
                name="rateUsd"
                type="number"
                min={RATE_MIN_USD}
                max={RATE_MAX_USD}
                step="0.5"
                defaultValue={values.rateUsd}
                placeholder={`${RATE_MIN_USD}–${RATE_MAX_USD}`}
                className={fieldClass}
              />
              <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
                ${RATE_MIN_USD}–${RATE_MAX_USD}
              </p>
              <FieldError message={state.fieldErrors?.rateUsd} />
            </div>
            <div>
              <label
                htmlFor="availabilitySummary"
                className="text-sm font-semibold"
              >
                Availability
              </label>
              <textarea
                id="availabilitySummary"
                name="availabilitySummary"
                rows={3}
                defaultValue={values.availabilitySummary}
                placeholder="e.g. Weekday evenings after Maghrib; weekends 10:00–13:00"
                className={areaClass}
              />
              <FieldError message={state.fieldErrors?.availabilitySummary} />
            </div>
          </div>
        </section>

        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_92%,transparent)] px-4 py-3 shadow-[var(--shadow-md)] backdrop-blur-md">
          <p className="max-w-xs text-xs text-[var(--color-on-surface-muted)] sm:text-sm">
            Save a draft anytime. Publish when parents should find you on Browse.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              formAction={draftAction}
              disabled={pending}
              className="btn-panel btn-panel-secondary"
            >
              {draftPending ? "Saving…" : "Save draft"}
            </button>
            <button
              type="submit"
              formAction={publishAction}
              disabled={pending}
              className="btn-panel btn-panel-primary"
            >
              {publishPending ? "Publishing…" : "Publish listing"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
