---
baseline_commit: NO_VCS
---

# Story 6.2: Progress Notes after lessons

Status: review

## Story

As a tutor,
I want to submit structured Progress Notes after lessons,
so that parents see what was covered and what to practice.

## Acceptance Criteria

1. **Given** a completed paid lesson
   **When** tutor submits covered / improve / homework
   **Then** a `progress_notes` row is stored (immutable to tutor)

2. **Given** a note exists
   **When** parent opens learner Progress
   **Then** they see history for that learner

3. **And** parent is notified on submit
4. **And** empty/loading states are clear

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Tutor submits Covered / Improve / Homework after attendance `completed`
- Immutable to tutor; `adminCorrectProgressNote` + audit for Epic 7
- Parent history at `/parent/learners/[id]/progress`
- Notification + calendar CTA + Learners Progress button

### File List

- `src/domain/progress-notes.ts`
- `src/domain/progress-notes.test.ts`
- `src/domain/recurring-bookings.ts`
- `src/server/actions/progress-notes.ts`
- `src/components/progress/progress-note-form.tsx`
- `src/components/progress/progress-note-history.tsx`
- `src/components/schedule/lesson-calendar.tsx`
- `src/components/learners/learner-list.tsx`
- `app/(tutor)/tutor/calendar/page.tsx`
- `app/(parent)/parent/learners/[id]/progress/page.tsx`
- `src/lib/firebase/db.ts`
- `firestore.rules`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/6-2-progress-notes-after-lessons.md`

## Change Log

- 2026-07-28: Story implemented.
