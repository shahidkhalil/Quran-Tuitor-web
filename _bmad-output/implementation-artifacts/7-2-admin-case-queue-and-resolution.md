---
baseline_commit: NO_VCS
---

# Story 7.2: Admin case queue & resolution

Status: review

## Story

As an admin,
I want to work Support Cases with booking and thread context,
so that I can resolve disputes inside SLA.

## Acceptance Criteria

1. Admin Cases surface lists support cases
2. Case detail shows parties, booking, attendance, Parent-Visible Thread
3. Admin can update status / internal notes / resolve with audited actions
4. Reporter sees outcome updates; only Admin can perform privileged actions

## Tasks / Subtasks

- [x] Domain fields: admin_internal_notes, outcome_note, resolved/closed timestamps
- [x] Admin list + detail actions + audit_log + reporter notification
- [x] `/admin/cases` queue + `/admin/cases/[id]` detail
- [x] Admin shell nav link
- [x] Reporter list shows outcome_note
- [x] Build verify

## Dev Agent Record

### Completion Notes List

- Admin queue filters: active / open / in_progress / resolved / closed / all
- Detail loads booking summary, attendance (paid lessons), message thread history
- Resolve/close requires visible outcome note; internal notes stay admin-only
- Actions audited; reporter notified on update
- `npm run build` to verify

### File List

- `src/domain/support-cases.ts`
- `src/server/actions/admin-support-cases.ts`
- `src/server/actions/support-cases.ts`
- `src/components/admin/admin-case-update-form.tsx`
- `src/components/support/support-case-list.tsx`
- `src/components/shell/admin-shell.tsx`
- `app/(admin)/admin/cases/page.tsx`
- `app/(admin)/admin/cases/[id]/page.tsx`
- `_bmad-output/implementation-artifacts/7-2-admin-case-queue-and-resolution.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-07-30: Implemented Story 7.2 — admin support case queue & resolution
