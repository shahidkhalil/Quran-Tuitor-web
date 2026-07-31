import Link from "next/link";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { summarizeHifz } from "@/domain/hifz-tracker";
import { listLearners } from "@/server/actions/learners";
import { listParentHifzTrackers } from "@/server/actions/hifz-tracker";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

export const metadata = { title: "Hifz tracker" };

export default async function ParentHifzIndexPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/parent/hifz");

  const [{ learners }, { trackers }] = await Promise.all([
    listLearners(),
    listParentHifzTrackers(),
  ]);

  const byLearner = new Map(trackers.map((t) => [t.learner_id, t]));

  return (
    <>
      <PanelPageHeader
        eyebrow="Memorisation"
        title="Hifz tracker"
        description="Track surah and ayah progress for each learner — separate from tutor lesson notes."
        actions={
          <Link href="/parent" className="btn-panel btn-panel-secondary">
            Home
          </Link>
        }
      />

      {learners.length === 0 ? (
        <div className="surface-card px-5 py-14 text-center">
          <p className="eyebrow text-[var(--color-accent)]">Family</p>
          <p className="display-title mt-2 text-2xl text-[var(--color-primary)]">
            Add a learner to start tracking
          </p>
          <Link
            href="/parent/learners"
            className="btn-panel btn-panel-primary mt-5 inline-flex"
          >
            Add learner
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {learners.map((learner) => {
            const tracker = byLearner.get(learner.id);
            const summary = summarizeHifz(tracker?.entries ?? []);
            return (
              <li key={learner.id}>
                <Link
                  href={`/parent/hifz/${learner.id}`}
                  className="surface-card surface-card-interactive block h-full p-5"
                >
                  <p className="eyebrow text-[var(--color-accent)]">Learner</p>
                  <h2 className="display-title mt-1 text-xl text-[var(--color-primary)]">
                    {learner.display_name}
                  </h2>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-on-surface-muted)]">
                      <span>Memorized</span>
                      <span className="text-[var(--color-primary)]">
                        {summary.memorized}/{summary.totalSurahs} ·{" "}
                        {summary.percentMemorized}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)]"
                        style={{ width: `${summary.percentMemorized}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-[var(--color-on-surface-muted)]">
                      {summary.inProgress} in progress · {summary.revision}{" "}
                      revision
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
