---
baseline_commit: NO_VCS
---

# Story 2.3: Admin vetting queue & decisions

Status: review

## Story

As an admin,
I want to review applications and approve, reject, or request more info,
so that only suitable tutors become Verified Tutors.

## Acceptance Criteria

1. Admin vetting queue with application detail review.
2. Approve / reject / request more info on pending applications.
3. Reject and needs_info require a reason.
4. audit_log entry on each decision.
5. Applicant notified; approve sets profile role to tutor.

## Tasks / Subtasks

- [x] Migration audit_log + admin RLS policies
- [x] Admin review page + signed asset URLs
- [x] Decision form + server actions
- [x] Queue links + build

## Dev Agent Record

### File List

- `supabase/migrations/20260720000005_admin_vetting.sql`
- `src/server/actions/admin-vetting.ts`
- `src/components/admin/application-review.tsx`
- `src/components/admin/vetting-decision-form.tsx`
- `app/(admin)/admin/page.tsx`
- `app/(admin)/admin/vetting/[id]/page.tsx`

## Change Log

- 2026-07-20: Admin vetting queue, review detail, approve/reject/needs_info + audit_log.
