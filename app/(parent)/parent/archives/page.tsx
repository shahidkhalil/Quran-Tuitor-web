import { PanelPageHeader } from "@/components/shell/panel-page-header";
import { lessonStatusLabel } from "@/domain/attendance";
import { formatLessonSlot } from "@/domain/recurring-bookings";
import { listParentScheduleLessons } from "@/server/actions/attendance";
import { listLearners } from "@/server/actions/learners";
import { listMyTrialBookings } from "@/server/actions/trials";
import { getCurrentProfile } from "@/server/services/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Archives" };

export default async function ParentArchivesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/parent/archives");

  const [{ calendarLessons }, { bookings }, { learners }] = await Promise.all([
    listParentScheduleLessons(),
    listMyTrialBookings(),
    listLearners(),
  ]);

  const learnerName = new Map(learners.map((l) => [l.id, l.display_name]));
  const pastLessons = calendarLessons
    .filter((l) => l.status !== "scheduled")
    .sort(
      (a, b) =>
        new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime(),
    )
    .slice(0, 40);

  const pastTrials = bookings
    .filter((b) =>
      ["completed", "declined", "cancelled", "timed_out"].includes(b.status),
    )
    .slice(0, 20);

  return (
    <>
      <PanelPageHeader
        eyebrow="History"
        title="Archives"
        description="Past paid lessons and closed trials — reviews and progress live on learner pages."
        actions={
          <Link href="/parent/watch" className="btn-panel btn-panel-secondary">
            Parental Watch
          </Link>
        }
      />

      <section className="mb-8">
        <p className="eyebrow mb-3 text-[var(--color-accent)]">Paid lessons</p>
        {pastLessons.length === 0 ? (
          <div className="surface-card px-5 py-10 text-center text-sm text-[var(--color-on-surface-muted)]">
            Completed lessons will appear here.
          </div>
        ) : (
          <ul className="space-y-3">
            {pastLessons.map((lesson) => (
              <li key={lesson.id} className="surface-card px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="status-pill status-pill-neutral">
                    {lessonStatusLabel(lesson.status)}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-on-surface)]">
                    {learnerName.get(lesson.learner_id) ?? "Learner"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                  {formatLessonSlot(lesson.slot_start, lesson.slot_end)}
                </p>
                {lesson.progress_note_id ? (
                  <Link
                    href={`/parent/learners/${lesson.learner_id}/progress`}
                    className="mt-2 inline-flex text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                  >
                    View progress note
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="eyebrow mb-3 text-[var(--color-accent)]">Trials</p>
        {pastTrials.length === 0 ? (
          <div className="surface-card px-5 py-10 text-center text-sm text-[var(--color-on-surface-muted)]">
            Closed trials will appear here.
          </div>
        ) : (
          <ul className="space-y-3">
            {pastTrials.map((trial) => (
              <li key={trial.id} className="surface-card px-4 py-4 sm:px-5">
                <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                  Trial · {trial.status.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
                  {learnerName.get(trial.learner_id) ?? "Learner"} ·{" "}
                  {new Date(trial.updated_at ?? trial.created_at).toLocaleString()}
                </p>
                <Link
                  href="/parent/bookings"
                  className="mt-2 inline-flex text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  Open bookings
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
