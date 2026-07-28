import { archiveLearner } from "@/server/actions/learners";
import { ageBandLabel, type LearnerProfile } from "@/domain/learners";
import Link from "next/link";

type Props = {
  learners: LearnerProfile[];
};

export function LearnerList({ learners }: Props) {
  if (learners.length === 0) {
    return (
      <div className="surface-card px-6 py-14 text-center">
        <p className="eyebrow text-[var(--color-accent)]">Get started</p>
        <p className="display-title mt-2 text-2xl text-[var(--color-primary)]">
          Add your first learner
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-on-surface-muted)]">
          Create a profile for your child or yourself. Every free trial and paid
          package attaches to a learner. Progress notes appear here after paid
          lessons.
        </p>
        <Link
          href="/parent/learners/new"
          className="btn-panel btn-panel-primary mt-6"
        >
          Add learner
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {learners.map((learner) => (
        <li
          key={learner.id}
          className="surface-card overflow-hidden p-0 sm:p-0"
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,var(--color-primary),#1a6b52)] text-sm font-bold text-white shadow-[var(--shadow-sm)]"
              >
                {learner.display_name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="display-title text-xl text-[var(--color-primary)]">
                    {learner.display_name}
                  </p>
                  <span className="status-pill status-pill-accent">
                    {learner.is_adult_self ? "Adult" : "Child"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                  {ageBandLabel(learner.age_band)}
                  {learner.level_goals ? ` · ${learner.level_goals}` : null}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/parent/learners/${learner.id}/progress`}
                className="btn-panel btn-panel-primary"
              >
                Progress notes
              </Link>
              <Link
                href={`/parent/learners/${learner.id}/edit`}
                className="btn-panel btn-panel-secondary"
              >
                Edit
              </Link>
              <form action={archiveLearner}>
                <input type="hidden" name="id" value={learner.id} />
                <button type="submit" className="btn-panel btn-panel-secondary">
                  Archive
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-[var(--color-outline)] bg-[var(--color-surface-muted)]/40 px-5 py-3 text-xs text-[var(--color-on-surface-muted)]">
            After a paid lesson is marked completed, tutor notes (covered /
            improve / homework) show under{" "}
            <Link
              href={`/parent/learners/${learner.id}/progress`}
              className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              Progress notes
            </Link>
            .
          </div>
        </li>
      ))}
    </ul>
  );
}
