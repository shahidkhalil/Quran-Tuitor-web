import { HomeworkChecklist } from "@/components/progress/homework-checklist";
import { PanelPageHeader } from "@/components/shell/panel-page-header";
import {
  checklistProgress,
  parseHomeworkChecklistItems,
} from "@/domain/homework-checklist";
import { listLearners } from "@/server/actions/learners";
import { listProgressNotesForLearner } from "@/server/actions/progress-notes";
import { getCurrentProfile } from "@/server/services/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Revision & homework" };

export default async function ParentRevisionPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/parent/revision");

  const { learners } = await listLearners();
  const bundles = await Promise.all(
    learners.map(async (l) => {
      const { notes } = await listProgressNotesForLearner(l.id);
      return {
        learner: l,
        homework: notes
          .filter((n) => n.homework.trim())
          .map((n) => {
            const items = parseHomeworkChecklistItems(n.homework);
            const doneKeys = n.homework_done_keys ?? [];
            const progress = checklistProgress(items, doneKeys);
            return {
              id: n.id,
              homework: n.homework,
              covered: n.covered,
              created_at: n.created_at,
              items,
              doneKeys,
              progress,
            };
          }),
      };
    }),
  );

  const total = bundles.reduce((n, b) => n + b.homework.length, 0);
  const openItems = bundles.reduce(
    (n, b) =>
      n +
      b.homework.reduce(
        (m, h) => m + Math.max(0, h.progress.total - h.progress.done),
        0,
      ),
    0,
  );

  return (
    <>
      <PanelPageHeader
        eyebrow="Practice"
        title="Revision & homework"
        description="Check off practice items from tutor notes between lessons."
        actions={
          <Link href="/parent/watch" className="btn-panel btn-panel-secondary">
            Parental Watch
          </Link>
        }
      />

      {total === 0 ? (
        <div className="surface-card px-5 py-14 text-center">
          <p className="eyebrow text-[var(--color-accent)]">Homework</p>
          <p className="display-title mt-2 text-2xl text-[var(--color-primary)]">
            No homework yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-on-surface-muted)]">
            After a completed paid lesson, tutors submit Covered / Improve /
            Homework notes. Homework shows up here as a checklist.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="eyebrow text-[var(--color-accent)]">Family practice</p>
              <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                {openItems === 0
                  ? "All checklist items are done — great work."
                  : `${openItems} open practice item${openItems === 1 ? "" : "s"} across ${total} note${total === 1 ? "" : "s"}.`}
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              Tap an item to mark it done
            </p>
          </div>

          {bundles.map(({ learner, homework }) =>
            homework.length === 0 ? null : (
              <section key={learner.id} className="surface-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="display-title text-xl text-[var(--color-primary)]">
                    {learner.display_name}
                  </h2>
                  <Link
                    href={`/parent/learners/${learner.id}/progress`}
                    className="text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                  >
                    Full progress
                  </Link>
                </div>
                <ul className="mt-4 space-y-4">
                  {homework.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[var(--radius-md)] border border-[var(--color-outline)] px-3 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-[var(--color-on-surface-muted)]">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                        <p className="text-xs font-semibold text-[var(--color-primary)]">
                          {item.progress.done}/{item.progress.total} done
                        </p>
                      </div>
                      {item.covered ? (
                        <p className="mt-2 text-xs text-[var(--color-on-surface-muted)]">
                          Covered: {item.covered.slice(0, 120)}
                          {item.covered.length > 120 ? "…" : ""}
                        </p>
                      ) : null}
                      <HomeworkChecklist
                        noteId={item.id}
                        items={item.items}
                        doneKeys={item.doneKeys}
                        returnTo="/parent/revision"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}
    </>
  );
}
