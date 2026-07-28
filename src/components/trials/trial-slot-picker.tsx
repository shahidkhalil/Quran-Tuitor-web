"use client";

import { useMemo, useState } from "react";
import { groupSlotsByDay, type TrialSlotOption } from "@/domain/trials";
import { cn } from "@/lib/cn";

type Props = {
  slots: TrialSlotOption[];
  availabilitySummary: string;
  error?: string;
};

export function TrialSlotPicker({
  slots,
  availabilitySummary,
  error,
}: Props) {
  const [selected, setSelected] = useState<string>("");
  const days = useMemo(() => groupSlotsByDay(slots), [slots]);
  const selectedSlot = slots.find((s) => s.start === selected);

  return (
    <fieldset className="space-y-4">
      <legend className="font-[family-name:var(--font-fraunces)] text-xl font-medium text-[var(--color-primary)]">
        Pick a slot
      </legend>
      <p className="text-sm text-[var(--color-on-surface-muted)]">
        30-minute free trial · times shown in your local timezone
      </p>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-4 py-3">
        <p className="text-xs font-semibold tracking-[0.04em] text-[var(--color-on-surface-muted)]">
          Tutor availability
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-on-surface)]">
          {availabilitySummary}
        </p>
      </div>

      <div className="space-y-6">
        {days.map((day) => (
          <div key={day.dayKey}>
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-on-surface)]">
              {day.dayLabel}
            </h3>
            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              role="radiogroup"
              aria-label={day.dayLabel}
            >
              {day.slots.map((slot) => {
                const isSelected = selected === slot.start;
                return (
                  <label
                    key={slot.start}
                    className={cn(
                      "relative flex min-h-12 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border px-3 py-2.5 text-center text-sm font-medium transition-colors",
                      "focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-focus-ring)] focus-within:ring-offset-2",
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                        : "border-[var(--color-outline)] bg-[var(--color-surface-elevated)] text-[var(--color-on-surface)] hover:border-[var(--color-outline-strong)] hover:bg-[var(--color-surface-muted)]",
                    )}
                  >
                    <input
                      type="radio"
                      name="slotStart"
                      value={slot.start}
                      required
                      checked={isSelected}
                      onChange={() => setSelected(slot.start)}
                      className="sr-only"
                    />
                    <span>{slot.timeLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedSlot ? (
        <p
          role="status"
          className="rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-on-surface)]"
        >
          Selected:{" "}
          <span className="font-semibold">{selectedSlot.label}</span>
        </p>
      ) : (
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          Choose a time above to continue.
        </p>
      )}

      {error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
