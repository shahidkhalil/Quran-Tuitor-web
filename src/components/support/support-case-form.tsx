"use client";

import { useActionState } from "react";
import {
  createSupportCase,
  type CreateSupportCaseState,
} from "@/server/actions/support-cases";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_DESCRIPTION_MAX,
  SUPPORT_SLA_COPY,
  supportCategoryLabel,
  type SupportBookingOption,
  type SupportCategory,
} from "@/domain/support-cases";

type Props = {
  options: SupportBookingOption[];
  defaultCategory?: SupportCategory | null;
  defaultBookingValue?: string | null;
  cancelHref: string;
};

const initial: CreateSupportCaseState = {};

export function SupportCaseForm({
  options,
  defaultCategory,
  defaultBookingValue,
  cancelHref,
}: Props) {
  const [state, action, pending] = useActionState(createSupportCase, initial);

  return (
    <form action={action} className="surface-card space-y-5 p-5 md:p-6">
      <div className="rounded-[var(--radius-md)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-on-surface)]">
        <p className="font-semibold text-[var(--color-primary)]">What to expect</p>
        <p className="mt-1 text-[var(--color-on-surface-muted)]">{SUPPORT_SLA_COPY}</p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="support-category"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Category
        </label>
        <select
          id="support-category"
          name="category"
          required
          defaultValue={defaultCategory ?? ""}
          disabled={pending}
          className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 text-sm text-[var(--color-on-surface)]"
        >
          <option value="" disabled>
            Select a category…
          </option>
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {supportCategoryLabel(c)}
            </option>
          ))}
        </select>
        {state.fieldErrors?.category ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.category}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="support-booking"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Booking
        </label>
        {options.length === 0 ? (
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            No trial or paid lessons yet. Book a free trial or schedule paid
            lessons before opening a case.
          </p>
        ) : (
          <select
            id="support-booking"
            name="booking"
            required
            defaultValue={defaultBookingValue ?? ""}
            disabled={pending}
            className="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 text-sm text-[var(--color-on-surface)]"
          >
            <option value="" disabled>
              Select a booking…
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        {state.fieldErrors?.booking ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.booking}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="support-description"
          className="text-sm font-semibold text-[var(--color-on-surface)]"
        >
          Description
        </label>
        <textarea
          id="support-description"
          name="description"
          required
          rows={5}
          maxLength={SUPPORT_DESCRIPTION_MAX}
          disabled={pending || options.length === 0}
          placeholder="What happened, which lesson, and how we can help…"
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-white px-3 py-2.5 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-muted)]"
        />
        {state.fieldErrors?.description ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {state.fieldErrors.description}
          </p>
        ) : (
          <p className="text-xs text-[var(--color-on-surface-muted)]">
            Stay on the platform — never send payment details to tutors
            directly.
          </p>
        )}
      </div>

      {state.error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending || options.length === 0}
          className="btn-panel btn-panel-primary"
        >
          {pending ? "Opening…" : "Open support case"}
        </button>
        <a href={cancelHref} className="btn-panel btn-panel-secondary">
          Cancel
        </a>
      </div>
    </form>
  );
}
