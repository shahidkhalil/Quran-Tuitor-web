import Link from "next/link";
import { ProgressNoteForm } from "@/components/progress/progress-note-form";
import { canSubmitProgressNote } from "@/domain/progress-notes";
import { formatLessonSlot } from "@/domain/recurring-bookings";
import type { CalendarLessonItem } from "@/components/schedule/lesson-calendar";

type Props = {
  lessons: CalendarLessonItem[];
  /** Prefill / highlight after attendance redirect */
  focusLessonId?: string;
};

export function ProgressNotesDuePanel({ lessons, focusLessonId }: Props) {
  const due = lessons.filter((l) => canSubmitProgressNote(l));
  if (due.length === 0) return null;

  const ordered = [...due].sort((a, b) => {
    if (focusLessonId && a.id === focusLessonId) return -1;
    if (focusLessonId && b.id === focusLessonId) return 1;
    return new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime();
  });

  return (
    <section className="mb-6 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-accent)]/35 bg-[var(--color-surface-elevated)] shadow-[var(--shadow-sm)]">
      <div className="border-b border-[var(--color-outline)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-accent)_14%,white),color-mix(in_srgb,var(--color-primary)_6%,white))] px-5 py-4">
        <p className="eyebrow text-[var(--color-accent)]">Action needed</p>
        <h2 className="display-title mt-1 text-xl text-[var(--color-primary)] sm:text-2xl">
          Progress notes due
        </h2>
        <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
          Submit Covered / Improve / Homework for completed lessons. Parents see
          these on Learners → Progress.
        </p>
      </div>
      <ul className="divide-y divide-[var(--color-outline)]">
        {ordered.map((lesson) => (
          <li
            key={lesson.id}
            id={`progress-due-${lesson.id}`}
            className={`px-5 py-5 ${
              focusLessonId === lesson.id
                ? "bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]"
                : ""
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-[var(--color-on-surface)]">
                {lesson.partyLabel}
              </p>
              <span className="status-pill status-pill-success">Completed</span>
            </div>
            <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
              Lesson {lesson.sequence} ·{" "}
              {formatLessonSlot(lesson.slot_start, lesson.slot_end)}
            </p>
            <ProgressNoteForm lessonId={lesson.id} />
            <p className="mt-3 text-xs text-[var(--color-on-surface-muted)]">
              Or open this day on the{" "}
              <Link
                href="/tutor/calendar"
                className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                calendar
              </Link>
              .
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
