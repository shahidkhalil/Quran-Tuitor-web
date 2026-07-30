"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MarkAttendanceForm } from "@/components/schedule/mark-attendance-form";
import { ProgressNoteForm } from "@/components/progress/progress-note-form";
import {
  attendanceOutcomeLabel,
  canMarkAttendance,
  lessonStatusLabel,
} from "@/domain/attendance";
import { canSubmitProgressNote } from "@/domain/progress-notes";
import {
  CALENDAR_FILTERS,
  CALENDAR_FILTER_LABELS,
  WEEKDAY_HEADERS,
  addMonths,
  buildMonthGrid,
  lessonLocalIsoDate,
  lessonMatchesCalendarFilter,
  monthTitle,
  startOfMonth,
  toLocalIsoDate,
  type CalendarFilter,
} from "@/domain/calendar";
import { formatLessonSlot } from "@/domain/recurring-bookings";
import type { ScheduledLesson } from "@/domain/recurring-bookings";

export type CalendarLessonItem = ScheduledLesson & {
  /** Tutor headline (parent) or learner name (tutor) */
  partyLabel: string;
};

type Props = {
  lessons: CalendarLessonItem[];
  emptyTitle?: string;
  emptyBody?: string;
  helpHref?: string;
  helpLabel?: string;
  enableMarkAttendance?: boolean;
  showTutorNoShowHelp?: boolean;
  /** Tutor: show progress note form after completed lessons */
  enableProgressNotes?: boolean;
  /** Parent: lesson IDs that already have a review */
  reviewedLessonIds?: string[];
};

function statusTone(status: ScheduledLesson["status"]) {
  if (status === "scheduled") return "bg-[var(--color-primary)]";
  if (status === "completed") return "bg-[var(--color-success)]";
  if (status === "tutor_no_show") return "bg-[var(--color-error)]";
  if (status === "student_no_show") return "bg-[var(--color-warning)]";
  return "bg-[var(--color-on-surface-muted)]";
}

function statusPillClass(status: ScheduledLesson["status"]) {
  if (status === "scheduled") return "status-pill status-pill-success";
  if (status === "completed") return "status-pill status-pill-success";
  if (status === "cancelled") return "status-pill status-pill-neutral";
  if (status === "tutor_no_show") return "status-pill status-pill-error";
  if (status === "student_no_show") return "status-pill status-pill-warning";
  return "status-pill status-pill-neutral";
}

function LessonDetailCard({
  lesson,
  helpHref,
  helpLabel,
  enableMarkAttendance,
  showTutorNoShowHelp,
  enableProgressNotes,
  reviewedLessonIds,
}: {
  lesson: CalendarLessonItem;
  helpHref: string;
  helpLabel: string;
  enableMarkAttendance: boolean;
  showTutorNoShowHelp: boolean;
  enableProgressNotes: boolean;
  reviewedLessonIds: string[];
}) {
  const hasJoin =
    Boolean(lesson.meeting_url) && lesson.status === "scheduled";
  const markable = enableMarkAttendance && canMarkAttendance(lesson);
  const awaitingMark =
    enableMarkAttendance &&
    lesson.status === "scheduled" &&
    !canMarkAttendance(lesson);
  const noteable = enableProgressNotes && canSubmitProgressNote(lesson);
  const noteDone =
    enableProgressNotes &&
    lesson.status === "completed" &&
    Boolean(lesson.progress_note_id);
  const alreadyReviewed = reviewedLessonIds.includes(lesson.id);

  return (
    <article className="surface-card p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="status-pill status-pill-accent">
          Lesson {lesson.sequence}
        </span>
        <span className={statusPillClass(lesson.status)}>
          {lessonStatusLabel(lesson.status)}
        </span>
      </div>
      <h3 className="display-title mt-3 text-xl text-[var(--color-primary)]">
        {lesson.partyLabel}
      </h3>
      <p className="mt-1 text-sm font-semibold text-[var(--color-on-surface)]">
        {formatLessonSlot(lesson.slot_start, lesson.slot_end)}
      </p>
      <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
        45-minute paid lesson · platform join link
      </p>

      {hasJoin && lesson.meeting_url ? (
        <div className="mt-4 space-y-2">
          <a
            href={lesson.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-panel btn-panel-primary"
          >
            Join lesson
          </a>
          <p className="text-xs text-[var(--color-on-surface-muted)]">
            Opens in a new tab. If it doesn&apos;t work,{" "}
            <Link
              href={helpHref}
              className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              {helpLabel}
            </Link>
            .
          </p>
        </div>
      ) : null}

      {lesson.status === "scheduled" && !hasJoin && !markable ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-[var(--color-warning)]">
            Join link isn&apos;t available yet for this session.
          </p>
          <Link href={helpHref} className="btn-panel btn-panel-secondary">
            {helpLabel}
          </Link>
        </div>
      ) : null}

      {awaitingMark ? (
        <p className="mt-4 text-sm text-[var(--color-on-surface-muted)]">
          Mark attendance after the lesson start time.
        </p>
      ) : null}

      {markable ? <MarkAttendanceForm lessonId={lesson.id} /> : null}

      {lesson.status !== "scheduled" ? (
        <p className="mt-4 text-sm text-[var(--color-on-surface-muted)]">
          Attendance:{" "}
          <span className="font-semibold text-[var(--color-on-surface)]">
            {attendanceOutcomeLabel(lesson.status)}
          </span>
          {lesson.attendance_marked_at
            ? ` · ${new Date(lesson.attendance_marked_at).toLocaleString()}`
            : null}
        </p>
      ) : null}

      {noteable ? <ProgressNoteForm lessonId={lesson.id} /> : null}

      {noteDone ? (
        <p className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-success)]/20 bg-[var(--color-accent-soft)]/50 px-3 py-2 text-sm text-[var(--color-success)]">
          Progress note submitted — parent can view it on the learner’s Progress
          page.
        </p>
      ) : null}

      {!enableProgressNotes && lesson.status === "completed" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/parent/learners/${lesson.learner_id}/progress`}
            className="btn-panel btn-panel-primary"
          >
            {lesson.progress_note_id
              ? "View progress notes"
              : "Open learner progress"}
          </Link>
          {alreadyReviewed ? (
            <span className="status-pill status-pill-success self-center">
              Reviewed
            </span>
          ) : (
            <a href="#lesson-reviews" className="btn-panel btn-panel-secondary">
              Leave a review
            </a>
          )}
        </div>
      ) : null}

      {showTutorNoShowHelp && lesson.status === "tutor_no_show" ? (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-3 py-2 text-sm">
          <p>Tutor no-show recorded. You can request rematch from Bookings.</p>
          <Link
            href="/parent/bookings?help=tutor-no-show"
            className="mt-2 inline-flex font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            Open bookings for support
          </Link>
        </div>
      ) : null}
    </article>
  );
}

function chipLabel(lesson: CalendarLessonItem) {
  const time = new Date(lesson.slot_start).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const name = lesson.partyLabel.trim();
  const short = name.length > 10 ? `${name.slice(0, 9)}…` : name;
  return short ? `${time} · ${short}` : time;
}

function pickFocusDay(
  matches: CalendarLessonItem[],
  filter: CalendarFilter,
  now: Date,
): string | null {
  if (matches.length === 0) return null;
  const todayIso = toLocalIsoDate(now);
  const sorted = [...matches].sort(
    (a, b) =>
      new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime(),
  );

  if (filter === "today" || filter === "ongoing") {
    const onToday = sorted.find(
      (l) => lessonLocalIsoDate(l.slot_start) === todayIso,
    );
    if (onToday) return lessonLocalIsoDate(onToday.slot_start);
  }

  if (filter === "upcoming" || filter === "all") {
    const upcoming = sorted.find(
      (l) =>
        l.status === "scheduled" &&
        new Date(l.slot_start).getTime() >= now.getTime(),
    );
    if (upcoming) return lessonLocalIsoDate(upcoming.slot_start);
  }

  return lessonLocalIsoDate(sorted[0]!.slot_start);
}

function isoToMonth(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return startOfMonth(new Date(y!, (m ?? 1) - 1, d ?? 1));
}

export function LessonCalendar({
  lessons,
  emptyTitle = "No lessons on the calendar",
  emptyBody = "Paid package sessions appear here after you set a weekly schedule.",
  helpHref = "/parent/bookings",
  helpLabel = "Go to bookings",
  enableMarkAttendance = false,
  showTutorNoShowHelp = false,
  enableProgressNotes = false,
  reviewedLessonIds = [],
}: Props) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const now = useMemo(() => new Date(nowMs), [nowMs]);

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const [selectedIso, setSelectedIso] = useState(() => {
    const focus = pickFocusDay(lessons, "all", new Date());
    return focus ?? toLocalIsoDate(new Date());
  });

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const filteredLessons = useMemo(
    () => lessons.filter((l) => lessonMatchesCalendarFilter(l, filter, now)),
    [lessons, filter, now],
  );

  const filterCounts = useMemo(() => {
    const counts = {} as Record<CalendarFilter, number>;
    for (const key of CALENDAR_FILTERS) {
      counts[key] =
        key === "all"
          ? lessons.length
          : lessons.filter((l) => lessonMatchesCalendarFilter(l, key, now))
              .length;
    }
    return counts;
  }, [lessons, now]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarLessonItem[]>();
    for (const lesson of filteredLessons) {
      const key = lessonLocalIsoDate(lesson.slot_start);
      const list = map.get(key) ?? [];
      list.push(lesson);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime(),
      );
    }
    return map;
  }, [filteredLessons]);

  const busiestDayIso = useMemo(() => {
    const map = new Map<string, number>();
    for (const lesson of lessons) {
      const key = lessonLocalIsoDate(lesson.slot_start);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [iso, count] of map) {
      if (count > bestCount) {
        best = iso;
        bestCount = count;
      }
    }
    return best;
  }, [lessons]);

  const grid = useMemo(() => buildMonthGrid(month, now), [month, now]);
  const selectedLessons = byDate.get(selectedIso) ?? [];

  const panelLessons =
    selectedLessons.length > 0 ? selectedLessons : filteredLessons;
  const showingAllMatches =
    selectedLessons.length === 0 && filteredLessons.length > 0;

  const selectedLabel = useMemo(() => {
    const [y, m, d] = selectedIso.split("-").map(Number);
    const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [selectedIso]);

  function applyFilter(next: CalendarFilter) {
    setFilter(next);
    const matches = lessons.filter((l) =>
      lessonMatchesCalendarFilter(l, next, new Date()),
    );
    const focus = pickFocusDay(matches, next, new Date());
    if (!focus) return;
    setSelectedIso(focus);
    setMonth(isoToMonth(focus));
  }

  function jumpToLessonDay(lesson: CalendarLessonItem) {
    const iso = lessonLocalIsoDate(lesson.slot_start);
    setSelectedIso(iso);
    setMonth(isoToMonth(iso));
  }

  function goToBusiestDay() {
    if (!busiestDayIso) return;
    setFilter("all");
    setSelectedIso(busiestDayIso);
    setMonth(isoToMonth(busiestDayIso));
  }

  if (lessons.length === 0) {
    return (
      <div className="surface-card px-5 py-14 text-center">
        <p className="eyebrow text-[var(--color-accent)]">Calendar</p>
        <p className="display-title mt-2 text-2xl text-[var(--color-primary)]">
          {emptyTitle}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-on-surface-muted)]">
          {emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Calendar filters"
      >
        {CALENDAR_FILTERS.map((key) => {
          const active = filter === key;
          const count = filterCounts[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => applyFilter(key)}
              className={[
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-[var(--color-outline)] bg-[var(--color-surface-elevated)] text-[var(--color-on-surface)] hover:border-[var(--color-primary)]/40",
              ].join(" ")}
            >
              {CALENDAR_FILTER_LABELS[key]}
              <span
                className={[
                  "ml-1.5 tabular-nums",
                  active
                    ? "text-white/80"
                    : "text-[var(--color-on-surface-muted)]",
                ].join(" ")}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-on-surface-muted)]">
        {filter === "today" ? (
          <span>
            Today = lessons on{" "}
            <strong className="text-[var(--color-on-surface)]">
              {now.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </strong>{" "}
            only.
          </span>
        ) : filter === "ongoing" ? (
          <span>
            Ongoing = in the live 45‑minute window now (updates every 15s).
          </span>
        ) : (
          <span>
            Tip: use{" "}
            <strong className="text-[var(--color-on-surface)]">All</strong>, then
            open a day with chips
            {busiestDayIso ? (
              <>
                {" "}
                (
                <button
                  type="button"
                  onClick={goToBusiestDay}
                  className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  busiest day
                </button>
                )
              </>
            ) : null}
            .
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] lg:items-start">
        <section className="surface-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-outline)] px-4 py-3 sm:px-5">
            <button
              type="button"
              className="btn-panel btn-panel-secondary !min-h-9 !px-3"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
            >
              ←
            </button>
            <div className="text-center">
              <p className="eyebrow text-[var(--color-accent)]">Month</p>
              <h2 className="display-title text-xl text-[var(--color-primary)] sm:text-2xl">
                {monthTitle(month)}
              </h2>
            </div>
            <button
              type="button"
              className="btn-panel btn-panel-secondary !min-h-9 !px-3"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-[var(--color-outline)] border-b border-[var(--color-outline)]">
            {WEEKDAY_HEADERS.map((d) => (
              <div
                key={d}
                className="bg-[var(--color-surface-muted)] px-1 py-2 text-center text-[10px] font-bold tracking-[0.06em] text-[var(--color-on-surface-muted)] sm:text-[11px]"
              >
                {d}
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-7 gap-px bg-[var(--color-outline)]"
            role="grid"
            aria-label={`Calendar ${monthTitle(month)}`}
          >
            {grid.map((day) => {
              const dayLessons = byDate.get(day.isoDate) ?? [];
              const selected = day.isoDate === selectedIso;
              return (
                <button
                  key={day.isoDate}
                  type="button"
                  role="gridcell"
                  onClick={() => setSelectedIso(day.isoDate)}
                  className={[
                    "relative flex min-h-[4.25rem] flex-col items-stretch bg-[var(--color-surface-elevated)] p-1.5 text-left transition sm:min-h-[5.25rem] sm:p-2",
                    day.inMonth ? "" : "opacity-40",
                    selected
                      ? "ring-2 ring-inset ring-[var(--color-primary)]"
                      : "hover:bg-[var(--color-surface-muted)]",
                    day.isToday ? "bg-[var(--color-accent-soft)]/35" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      day.isToday
                        ? "bg-[var(--color-primary)] text-white"
                        : "text-[var(--color-on-surface)]",
                    ].join(" ")}
                  >
                    {day.date.getDate()}
                  </span>
                  <div className="mt-1 flex flex-1 flex-col gap-0.5 overflow-hidden">
                    {dayLessons.slice(0, 3).map((lesson) => (
                      <span
                        key={lesson.id}
                        className={[
                          "truncate rounded px-1 py-0.5 text-[9px] font-semibold text-white sm:text-[10px]",
                          statusTone(lesson.status),
                        ].join(" ")}
                      >
                        {chipLabel(lesson)}
                      </span>
                    ))}
                    {dayLessons.length > 3 ? (
                      <span className="text-[9px] font-bold text-[var(--color-primary)]">
                        +{dayLessons.length - 3} more ({dayLessons.length}{" "}
                        total)
                      </span>
                    ) : dayLessons.length > 0 ? (
                      <span className="text-[9px] font-semibold text-[var(--color-on-surface-muted)]">
                        {dayLessons.length} lesson
                        {dayLessons.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-[var(--color-outline)] px-4 py-3 text-[11px] text-[var(--color-on-surface-muted)] sm:px-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--color-primary)]" />{" "}
              Scheduled
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--color-success)]" />{" "}
              Completed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--color-warning)]" />{" "}
              Student no-show
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[var(--color-error)]" />{" "}
              Tutor no-show
            </span>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="eyebrow text-[var(--color-accent)]">
              {showingAllMatches ? "Matching results" : "Selected day"}
            </p>
            <h3 className="display-title mt-1 text-xl text-[var(--color-primary)]">
              {showingAllMatches
                ? CALENDAR_FILTER_LABELS[filter]
                : selectedLabel}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
              {panelLessons.length === 0
                ? `No ${CALENDAR_FILTER_LABELS[filter].toLowerCase()} lessons right now.`
                : showingAllMatches
                  ? `${panelLessons.length} match${panelLessons.length === 1 ? "" : "es"} listed below.`
                  : `${panelLessons.length} ${CALENDAR_FILTER_LABELS[filter].toLowerCase()} lesson${panelLessons.length === 1 ? "" : "s"}`}
            </p>
          </div>

          {panelLessons.length === 0 ? (
            <div className="surface-card px-5 py-10 text-center">
              <p className="text-sm text-[var(--color-on-surface-muted)]">
                {filter === "all"
                  ? "Select a day with a colored time chip to see join links and details."
                  : "Nothing in this filter right now."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {filter !== "all" ? (
                  <button
                    type="button"
                    className="btn-panel btn-panel-primary"
                    onClick={() => applyFilter("all")}
                  >
                    Show all lessons
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-panel btn-panel-secondary"
                  onClick={goToBusiestDay}
                >
                  Jump to busiest day
                </button>
              </div>
            </div>
          ) : (
            <div className="max-h-[min(70vh,52rem)] space-y-3 overflow-y-auto pr-1">
              {panelLessons.map((lesson) => (
                <div key={lesson.id}>
                  {showingAllMatches ? (
                    <button
                      type="button"
                      onClick={() => jumpToLessonDay(lesson)}
                      className="mb-2 text-left text-xs font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
                    >
                      Jump to{" "}
                      {new Date(lesson.slot_start).toLocaleDateString(
                        undefined,
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </button>
                  ) : null}
                  <LessonDetailCard
                    lesson={lesson}
                    helpHref={helpHref}
                    helpLabel={helpLabel}
                    enableMarkAttendance={enableMarkAttendance}
                    showTutorNoShowHelp={showTutorNoShowHelp}
                    enableProgressNotes={enableProgressNotes}
                    reviewedLessonIds={reviewedLessonIds}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
