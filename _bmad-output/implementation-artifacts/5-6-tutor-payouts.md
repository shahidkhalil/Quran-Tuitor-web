---
baseline_commit: NO_VCS
---

# Story 5.6: Tutor payouts

Status: review

## Story

As a tutor,
I want to request payouts of cleared earnings to a saved payout method,
so that I get paid reliably through the platform.

## Acceptance Criteria

1. **Given** a tutor with positive ledger balance
   **When** they complete Stripe Connect Express onboarding
   **Then** their profile stores `stripe_connect_account_id` and payout readiness

2. **Given** cleared available balance (≥ minimum) and Connect ready (or simulate mode)
   **When** they request a payout
   **Then** a `payout_requests` row is created for that amount only
   **And** on success a negative immutable `ledger_entries` (`payout`) posts and status is `paid`
   **And** on failure status is `failed` with a Support Case path stub

3. **Given** tutor Earnings
   **When** page loads
   **Then** available balance, payout method status, request CTA, and payout history are visible

4. **Given** Admin marks a pending/manual payout
   **When** they confirm paid or failed
   **Then** audit_log is written and ledger is updated only when marking paid

## ASSUMPTIONS
- Tutor-initiated payout (not cron) for MVP; weekly cadence copy.
- Available = max(0, sum of ledger lines).
- Min payout $5.00 (`PAYOUT_MIN_CENTS=500`).
- `PAYOUT_MODE=simulate` completes without Stripe transfer (local/demo).
- Support Case = link to `/tutor/earnings?help=payout-failed` until Epic 7.

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Stripe Connect Express onboarding + sync
- Tutor request payout with simulate or live transfer
- Ledger `payout` debit on success; failed shows support path
- Admin resolve payout with audit on `/admin/ledger`

### File List

- `src/domain/payouts.ts`
- `src/domain/payouts.test.ts`
- `src/domain/ledger.ts`
- `src/server/actions/payouts.ts`
- `src/server/services/profile.ts`
- `src/lib/firebase/db.ts`
- `src/components/payouts/payout-actions-panel.tsx`
- `src/components/admin/admin-payout-resolve-form.tsx`
- `app/(tutor)/tutor/earnings/page.tsx`
- `app/(tutor)/tutor/page.tsx`
- `app/(admin)/admin/ledger/page.tsx`
- `firestore.rules`
- `.env.example`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-6-tutor-payouts.md`

## Change Log

- 2026-07-28: Story created and implemented tutor payouts.
