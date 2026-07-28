---
baseline_commit: NO_VCS
---

# Story 2.2: Application status visibility for applicants

Status: review

## Story

As a tutor applicant,
I want to see my application status and any admin requests/reasons,
so that I am not left in a black hole.

## Acceptance Criteria

1. Timeline for pending | needs_info | approved | rejected.
2. needs_info / rejected show admin reason (no silent rejection).
3. Status changes → in-app notification (+ email if RESEND_API_KEY set).
4. Applicant can respond/upload when needs_info.

## Tasks / Subtasks

- [x] Migration events + notifications + RPC
- [x] Status timeline UI + reason panel
- [x] needs_info response form
- [x] Notifications on tutor home
- [x] Wire submit to write event + notify
- [x] Build

## Dev Agent Record

### File List

- `supabase/migrations/20260720000004_application_status_visibility.sql`
- `src/domain/tutor-applications.ts`
- `src/server/actions/tutor-applications.ts` (events + respond)
- `src/server/actions/notifications.ts`
- `src/components/tutors/application-status-timeline.tsx`
- `src/components/tutors/needs-info-response-form.tsx`
- `src/components/tutors/notification-list.tsx`
- `app/(tutor)/tutor/application/page.tsx`
- `app/(tutor)/tutor/page.tsx`

## Change Log

- 2026-07-20: Status timeline, needs_info response, in-app notifications; migrations 000002–000004 applied on remote.
