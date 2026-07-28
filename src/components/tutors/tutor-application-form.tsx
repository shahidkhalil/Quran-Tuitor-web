"use client";

import {
  submitTutorApplication,
  type ApplicationFormState,
} from "@/server/actions/tutor-applications";
import {
  GENDER_OPTIONS,
  PAYOUT_METHODS,
} from "@/domain/tutor-applications";
import { useActionState } from "react";

const initialState: ApplicationFormState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-[var(--color-error)]" role="alert">
      {message}
    </p>
  );
}

const fieldClass =
  "min-h-11 w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]";

const areaClass =
  "w-full rounded-[var(--radius-default)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]";

export function TutorApplicationForm() {
  const [state, formAction, pending] = useActionState(
    submitTutorApplication,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <section className="application-form-section space-y-4">
        <div>
          <p className="eyebrow text-[var(--color-accent)]">About you</p>
          <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
            Basics
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="fullName" className="text-sm font-semibold">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              autoComplete="name"
              className={fieldClass}
            />
            <FieldError message={state.fieldErrors?.fullName} />
          </div>
          <div className="space-y-2">
            <label htmlFor="country" className="text-sm font-semibold">
              Country
            </label>
            <input
              id="country"
              name="country"
              required
              placeholder="e.g. Pakistan"
              autoComplete="country-name"
              className={fieldClass}
            />
            <FieldError message={state.fieldErrors?.country} />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-semibold">
              Phone (optional)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="gender" className="text-sm font-semibold">
              Gender (optional)
            </label>
            <select id="gender" name="gender" className={fieldClass}>
              <option value="">Select</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="languages" className="text-sm font-semibold">
              Languages you teach in
            </label>
            <input
              id="languages"
              name="languages"
              required
              placeholder="e.g. English, Urdu, Arabic"
              className={fieldClass}
            />
            <FieldError message={state.fieldErrors?.languages} />
          </div>
        </div>
      </section>

      <section className="application-form-section space-y-4">
        <div>
          <p className="eyebrow text-[var(--color-accent)]">Trust</p>
          <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
            Credentials & children
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="credentialsSummary" className="text-sm font-semibold">
              Credentials summary
            </label>
            <textarea
              id="credentialsSummary"
              name="credentialsSummary"
              required
              rows={3}
              placeholder="e.g. Hafiz, Tajweed certificate from …"
              className={areaClass}
            />
            <FieldError message={state.fieldErrors?.credentialsSummary} />
          </div>
          <div className="space-y-2">
            <label htmlFor="credentialFile" className="text-sm font-semibold">
              Credential document
            </label>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              PDF or image of Ijazah / certificate (required, max 5 MB).
            </p>
            <input
              id="credentialFile"
              name="credentialFile"
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              required
              className="block w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-outline-strong)]/40 bg-[var(--color-surface-elevated)] px-3 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            <FieldError message={state.fieldErrors?.credentialFile} />
          </div>
          <div className="space-y-2">
            <label htmlFor="childExperience" className="text-sm font-semibold">
              Experience teaching children
            </label>
            <textarea
              id="childExperience"
              name="childExperience"
              required
              rows={3}
              placeholder="Ages you’ve taught, approach, safeguarding awareness…"
              className={areaClass}
            />
            <FieldError message={state.fieldErrors?.childExperience} />
          </div>
          <div className="space-y-2 max-w-xs">
            <label htmlFor="yearsTeaching" className="text-sm font-semibold">
              Years teaching (optional)
            </label>
            <input
              id="yearsTeaching"
              name="yearsTeaching"
              type="number"
              min={0}
              max={60}
              inputMode="numeric"
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      <section className="application-form-section space-y-4">
        <div>
          <p className="eyebrow text-[var(--color-accent)]">Optional</p>
          <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
            Intro video
          </p>
          <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
            Skip for now if you prefer — a YouTube or Drive link works later.
          </p>
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="introVideoUrl" className="text-sm font-semibold">
              Video URL
            </label>
            <input
              id="introVideoUrl"
              name="introVideoUrl"
              type="url"
              placeholder="https://…"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="introVideoFile" className="text-sm font-semibold">
              Or upload (MP4 / WebM, max 8 MB)
            </label>
            <input
              id="introVideoFile"
              name="introVideoFile"
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="block w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-outline-strong)]/40 bg-[var(--color-surface-elevated)] px-3 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
          </div>
          <FieldError message={state.fieldErrors?.introVideo} />
        </div>
      </section>

      <section className="application-form-section space-y-4">
        <div>
          <p className="eyebrow text-[var(--color-accent)]">Payments</p>
          <p className="display-title mt-1 text-xl text-[var(--color-primary)]">
            Payout preference
          </p>
          <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
            Parents always pay the platform — never ask for personal transfers.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="payoutMethod" className="text-sm font-semibold">
              Preferred payout method
            </label>
            <select
              id="payoutMethod"
              name="payoutMethod"
              required
              className={fieldClass}
              defaultValue=""
            >
              <option value="" disabled>
                Select method
              </option>
              {PAYOUT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.payoutMethod} />
          </div>
          <div className="space-y-2">
            <label htmlFor="payoutNotes" className="text-sm font-semibold">
              Payout contact notes (optional)
            </label>
            <input
              id="payoutNotes"
              name="payoutNotes"
              placeholder="e.g. PayPal email for later Connect setup"
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      {state.error ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[color-mix(in_srgb,var(--color-error)_8%,white)] px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-4 py-4">
        <p className="max-w-sm text-sm text-[var(--color-on-surface-muted)]">
          Our team reviews every application before listing.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="btn-panel btn-panel-primary"
        >
          {pending ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
