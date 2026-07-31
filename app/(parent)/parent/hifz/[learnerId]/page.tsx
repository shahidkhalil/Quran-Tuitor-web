import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HifzProgressForm } from "@/components/hifz/hifz-progress-form";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  getSurahMeta,
  hifzStatusLabel,
  summarizeHifz,
} from "@/domain/hifz-tracker";
import { getLearner } from "@/server/actions/learners";
import {
  clearHifzSurahProgress,
  getHifzTrackerForLearner,
} from "@/server/actions/hifz-tracker";
import { getCurrentProfile } from "@/server/services/profile";

export const metadata = { title: "Hifz tracker" };

type Props = {
  params: Promise<{ learnerId: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function ParentHifzLearnerPage({
  params,
  searchParams,
}: Props) {
  const profile = await getCurrentProfile();
  const { learnerId } = await params;
  const { saved } = await searchParams;
  if (!profile) {
    redirect(`/sign-in?next=/parent/hifz/${encodeURIComponent(learnerId)}`);
  }

  const [{ learner }, { tracker, error }] = await Promise.all([
    getLearner(learnerId),
    getHifzTrackerForLearner(learnerId),
  ]);

  if (!learner) notFound();
  if (error || !tracker) {
    return (
      <div className="surface-card p-5">
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {error ?? "Could not load tracker."}
        </p>
      </div>
    );
  }

  const summary = summarizeHifz(tracker.entries);
  const entries = [...tracker.entries].sort(
    (a, b) => b.updated_at.localeCompare(a.updated_at),
  );

  return (
    <>
      <PanelPageHeader
        eyebrow="Memorisation"
        title={`${learner.display_name} · Hifz`}
        description="Log surah progress and ayah reached. Share with tutors in messages if helpful."
        actions={
          <Link href="/parent/hifz" className="btn-panel btn-panel-secondary">
            All learners
          </Link>
        }
      />

      <div className="mb-6 surface-card p-5">
        {saved ? (
          <p
            role="status"
            className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-success)]/25 bg-[var(--color-accent-soft)]/50 px-3 py-2 text-sm font-semibold text-[var(--color-primary)]"
          >
            Progress saved.
          </p>
        ) : null}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-[var(--color-accent)]">Progress</p>
            <p className="display-title mt-1 text-3xl text-[var(--color-primary)]">
              {summary.percentMemorized}%
            </p>
            <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
              {summary.memorized} memorized · {summary.inProgress} in progress ·{" "}
              {summary.revision} revision
            </p>
          </div>
          <Link
            href={`/parent/learners/${learner.id}/progress`}
            className="btn-panel btn-panel-secondary !min-h-9"
          >
            Progress notes
          </Link>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)]"
            style={{ width: `${summary.percentMemorized}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5 sm:p-6">
          <p className="eyebrow text-[var(--color-accent)]">Update</p>
          <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
            Log a surah
          </h2>
          <div className="mt-4">
            <HifzProgressForm learnerId={learner.id} />
          </div>
        </section>

        <section className="surface-card p-5 sm:p-6">
          <p className="eyebrow text-[var(--color-accent)]">Tracked surahs</p>
          <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
            {entries.length === 0 ? "Nothing logged yet" : `${entries.length} surahs`}
          </h2>
          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
              Start with Juz Amma or Al-Fatiha using the form.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {entries.map((entry) => {
                const meta = getSurahMeta(entry.surah_number);
                return (
                  <li
                    key={entry.surah_number}
                    className="rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                          {entry.surah_number}. {meta?.name ?? "Surah"}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-on-surface-muted)]">
                          <span className="status-pill status-pill-accent mr-2 inline-flex">
                            {hifzStatusLabel(entry.status)}
                          </span>
                          {entry.ayah_reached != null
                            ? `Ayah ${entry.ayah_reached}${meta ? ` / ${meta.ayahs}` : ""}`
                            : null}
                        </p>
                        {entry.notes ? (
                          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
                            {entry.notes}
                          </p>
                        ) : null}
                      </div>
                      <form action={clearHifzSurahProgress}>
                        <input type="hidden" name="learnerId" value={learner.id} />
                        <input
                          type="hidden"
                          name="surahNumber"
                          value={entry.surah_number}
                        />
                        <button
                          type="submit"
                          className="text-xs font-semibold text-[var(--color-on-surface-muted)] underline-offset-2 hover:underline"
                        >
                          Clear
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
