---
baseline_commit: NO_VCS
---

# Story 7.5: Admin operations console

Status: review

## Story

As an admin,
I want a complete ops console for applications, listings, bookings, cases, suspensions, and commission config,
so that I can run the managed marketplace day to day.

## Acceptance Criteria

1. Admin surfaces for applications, listings, bookings, cases, suspensions, commission
2. Privileged actions require Admin role
3. Commission config changes are audited
4. Admin shell desktop-optimized; non-admins blocked

## Dev Agent Record

### Completion Notes List

- Admin home ops dashboard with stats + deep links
- `/admin/bookings`, `/admin/listings`, `/admin/settings` (commission)
- Firestore `platform_config/commission` overrides env; earnings use active rate
- Commission updates audited

### File List

- `src/server/actions/admin-ops.ts`
- `src/server/actions/ledger.ts`
- `src/components/admin/admin-commission-form.tsx`
- `src/components/shell/admin-shell.tsx`
- `app/(admin)/admin/page.tsx`
- `app/(admin)/admin/bookings/page.tsx`
- `app/(admin)/admin/listings/page.tsx`
- `app/(admin)/admin/settings/page.tsx`
- `app/(admin)/admin/ledger/page.tsx`
- `src/lib/firebase/db.ts`
- `firestore.rules`
- `_bmad-output/implementation-artifacts/7-5-admin-operations-console-bookings-listings-commission.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-07-30: Implemented Story 7.5 — complete admin ops console
