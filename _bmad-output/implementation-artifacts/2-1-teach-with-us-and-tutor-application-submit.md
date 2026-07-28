---
baseline_commit: NO_VCS
---

# Story 2.1: Teach with us & tutor application submit

Status: review

## Story

As a tutor applicant,
I want to submit my application with credentials and intro media,
so that I can be considered for the marketplace.

## Acceptance Criteria

1. Teach with us → apply flow (UX-DR6).
2. Required fields: identity, credentials, languages, child experience, intro video, payout prefs → status `pending`.
3. Incomplete submit blocked with field-level errors.
4. Only application-related tables/storage in this story.
5. Application visible in admin queue (list; decisions in 2.3).

## Tasks / Subtasks

- [x] Migration `tutor_applications` + storage + tutor_applicant signup
- [x] Teach marketing page + register-as-tutor path
- [x] Application form + server action (uploads)
- [x] Tutor home CTA + admin pending list
- [x] Build + lint
- [ ] User: `supabase db push` (agent network could not reach pooler)

## Dev Agent Record

### File List

- `supabase/migrations/20260720000002_tutor_applications.sql`
- `src/domain/tutor-applications.ts`
- `src/server/actions/tutor-applications.ts`
- `src/components/tutors/tutor-application-form.tsx`
- `app/(marketing)/teach/page.tsx`
- `app/(tutor)/tutor/application/page.tsx`
- `app/(tutor)/tutor/page.tsx`
- `app/(admin)/admin/page.tsx`
- `app/(auth)/register/page.tsx` + `register-form.tsx` (`?as=tutor`)
- `app/(auth)/sign-in/page.tsx` + `sign-in-form.tsx` (`?next=`)
- `src/server/actions/auth.ts` (tutor_applicant role + next redirect)

## Change Log

- 2026-07-20: Teach with us + application submit + admin pending queue list; build green.
