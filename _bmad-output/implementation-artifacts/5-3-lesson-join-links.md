---
baseline_commit: NO_VCS
---

# Story 5.3: Lesson join links

Status: review

## Story

As a parent or tutor,
I want a third-party meeting link for each paid session,
so that we can join lessons without native video in the app.

## Acceptance Criteria

1. **Given** a scheduled lesson on a Recurring Booking
   **When** parent or tutor opens calendar / upcoming lessons
   **Then** each lesson shows a Join CTA using `meeting_url` (Jitsi MVP, AD-8)
   **And** the URL is stored on `scheduled_lessons.meeting_url`

2. **Given** only the Parent Account and Verified Tutor for that booking
   **When** lessons are listed
   **Then** join links are only returned via existing parent/tutor scoped queries (no public/admin leak in this story)
   **And** no minor-facing private channel for the link exists

3. **Given** a lesson with missing `meeting_url` (legacy from 5.2) or join fails for the user
   **When** they view the lesson card
   **Then** they see clear copy + a path to Bookings / help (graceful degradation, NFR3)
   **And** missing URLs are backfilled server-side when listing upcoming lessons

4. **Given** a new Recurring Booking is created
   **When** scheduled lessons are written
   **Then** each lesson gets a deterministic `meeting_url` at create time (same pattern as trial accept)

## Tasks / Subtasks

- [x] Domain: `buildLessonMeetingUrl(lessonId)` + unit test
- [x] Create recurring: set `meeting_url` on each new scheduled lesson
- [x] List parent/tutor upcoming: ensure/backfill null `meeting_url`
- [x] UI: `UpcomingLessons` Join button + missing-link fallback (marketplace patterns)
- [x] Copy: remove “join link arrives later” stubs on schedule/calendar pages

## Dev Notes

### Brownfield
- SoR: Firestore + Firebase Auth (not Postgres).
- `ScheduledLesson.meeting_url` already typed; create path currently writes `null`.
- Trial pattern: `buildTrialMeetingUrl` → `https://meet.jit.si/qtm-trial-{id}` on accept (Story 4.2).
- Surfaces: parent `/parent/schedule`, tutor `/tutor/calendar`, shared `UpcomingLessons`.
- Authz: `listParentUpcomingLessons` / `listTutorUpcomingLessons` already filter by `parent_id` / `tutor_id`.

### ASSUMPTIONS (MVP)
- Auto-generate Jitsi room per lesson (not Zoom OAuth / manual paste yet). AD-8 allows URL-only.
- Same room URL for the life of the lesson; no passcode field for MVP.
- Support Case epic (7.1) not built — fallback links to `/parent/bookings` (parent) and `/tutor/requests` (tutor) with help copy.
- Do not build in-app WebRTC.

### Must follow
- Server Actions only for writes / backfill.
- UX: `.btn-panel-primary` Join CTA; marketplace shells unchanged.
- No Stripe / attendance / earnings work (5.4–5.6).

### Structure
```text
src/domain/recurring-bookings.ts          # buildLessonMeetingUrl
src/domain/recurring-bookings.test.ts
src/server/actions/recurring-bookings.ts  # create + ensure on list
src/components/schedule/upcoming-lessons.tsx
app/(parent)/parent/schedule/page.tsx     # copy
app/(tutor)/tutor/calendar/page.tsx       # copy
```

### References
- epics.md Story 5.3 / FR-14 / AD-8
- Story 5.2 recurring model + calendars
- Story 4.2 trial `meeting_url` pattern
- `_bmad-output/planning-artifacts/ux-design-patterns.md`

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Jitsi `meeting_url` set at recurring create; backfilled on list for 5.2 legacy rows
- Parent schedule + tutor calendar show Join lesson CTA with help fallback
- Domain unit tests for `buildLessonMeetingUrl` pass

### File List

- `src/domain/recurring-bookings.ts`
- `src/domain/recurring-bookings.test.ts`
- `src/server/actions/recurring-bookings.ts`
- `src/components/schedule/upcoming-lessons.tsx`
- `app/(parent)/parent/schedule/page.tsx`
- `app/(tutor)/tutor/calendar/page.tsx`
- `app/(parent)/parent/checkout/page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-3-lesson-join-links.md`

## Change Log

- 2026-07-28: Story context created and implemented lesson join links.
