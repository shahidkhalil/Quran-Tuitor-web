"use client";

import { useActionState } from "react";
import {
  HIFZ_SURAHS,
  HIFZ_STATUSES,
  hifzStatusLabel,
  type HifzSurahEntry,
} from "@/domain/hifz-tracker";
import {
  saveHifzSurahProgress,
  type HifzFormState,
} from "@/server/actions/hifz-tracker";

type Props = {
  learnerId: string;
  editing?: HifzSurahEntry | null;
};

const initial: HifzFormState = {};

export function HifzProgressForm({ learnerId, editing }: Props) {
  const [state, action, pending] = useActionState(saveHifzSurahProgress, initial);
  const defaultSurah = editing?.surah_number ?? 1;
  const meta = HIFZ_SURAHS.find((s) => s.n === defaultSurah);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="learnerId" value={learnerId} />
      <div>
        <label
          htmlFor="surahNumber"
          className="text-xs font-semibold text-[var(--color-on-surface-muted)]"
        >
          Surah
        </label>
        <select
          id="surahNumber"
          name="surahNumber"
          required
          defaultValue={String(defaultSurah)}
          className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm"
        >
          {HIFZ_SURAHS.map((s) => (
            <option key={s.n} value={s.n}>
              {s.n}. {s.name} ({s.ayahs} ayahs)
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="status"
            className="text-xs font-semibold text-[var(--color-on-surface-muted)]"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={editing?.status ?? "in_progress"}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm"
          >
            {HIFZ_STATUSES.map((s) => (
              <option key={s} value={s}>
                {hifzStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="ayahReached"
            className="text-xs font-semibold text-[var(--color-on-surface-muted)]"
          >
            Ayah reached
          </label>
          <input
            id="ayahReached"
            name="ayahReached"
            type="number"
            min={1}
            max={meta?.ayahs ?? 286}
            placeholder={meta ? `1–${meta.ayahs}` : "Optional"}
            defaultValue={editing?.ayah_reached ?? ""}
            className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="notes"
          className="text-xs font-semibold text-[var(--color-on-surface-muted)]"
        >
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          maxLength={500}
          defaultValue={editing?.notes ?? ""}
          placeholder="e.g. Strong on muraja’ah, needs work on ayat 12–15"
          className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-sm"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm text-[var(--color-success)]">
          {state.success}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-panel btn-panel-primary"
      >
        {pending ? "Saving…" : editing ? "Update surah" : "Save progress"}
      </button>
    </form>
  );
}
