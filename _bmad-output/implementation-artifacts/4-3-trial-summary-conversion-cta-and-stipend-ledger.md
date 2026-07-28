---
baseline_commit: NO_VCS
---

# Story 4.3: Trial summary, conversion CTA & stipend ledger

Status: review

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a tutor and parent,
I want a post-trial summary and correct trial economics,
so that the parent can convert and the tutor is credited per policy.

## Acceptance Criteria

1. **Given** an accepted trial whose scheduled end has passed (or the booking is already completable)  
   **When** the tutor submits lesson summary + recommendation  
   **Then** booking status becomes `completed`, `summary` and `recommendation` are stored, and the parent can view them on the booking (FR11)

2. **Given** summary is submitted **OR** scheduled end has passed without a summary yet  
   **When** the parent views the booking  
   **Then** a Conversion CTA toward Recurring Booking / paid checkout is visible  
   **And** late/missing summary does not block conversion (FR11 assumption)

3. **Given** trial economics are applied on completion (FR12)  
   **When** the tutor successfully submits the summary (first time)  
   **Then** parent-facing amount for the trial remains `$0` (`parent_amount_cents === 0`)  
   **And** tutor ledger shows one `trial_stipend` line when policy amount > 0 (platform-subsidized; never charged to parent)  
   **And** stipend credit is **idempotent** (retry / double-submit does not double-credit)

4. **Given** policy stipend amount is `0`  
   **When** summary is submitted  
   **Then** booking still completes and summary is visible — no ledger row required

## Tasks / Subtasks

- [x] Domain: trial completion + conversion gates (AC: #1–2)
  - [x] Add helpers: `canSubmitTrialSummary(booking, now)`, `canShowConversionCta(booking, now)`
  - [x] Add `TRIAL_STIPEND_CENTS` policy constant (see Dev Notes ASSUMPTION)
  - [x] Optionally add `completed_at` on `TrialBooking` if useful (or reuse `updated_at` — prefer explicit `completed_at`)
- [x] Domain: ledger types (AC: #3–4)
  - [x] Create `src/domain/ledger.ts` — `LedgerEntry`, entry kinds including `trial_stipend`, money as integer cents + `USD`
- [x] Server: submit summary + credit stipend (AC: #1, #3–4)
  - [x] `submitTrialSummary` in `src/server/actions/trials.ts` (verified tutor only; booking must be theirs; status `accepted`; `now >= slot_end`)
  - [x] Set `status: "completed"`, `summary`, `recommendation`, `completed_at`
  - [x] Call idempotent `creditTrialStipend(booking)` 
  - [x] Notify parent via `createInAppNotification` → `/parent/bookings`
  - [x] `revalidatePath` for parent bookings + tutor requests (+ earnings if added)
- [x] Server: ledger list (AC: #3)
  - [x] `listTutorLedger` (tutor own entries only) in `src/server/actions/ledger.ts` (or colocated)
  - [x] Stipend write uses Admin SDK only; never client-writable
- [x] Firestore wiring (AC: #3)
  - [x] Add `COLLECTIONS.ledgerEntries = "ledger_entries"`
  - [x] Rules: tutor/admin read own/all; `allow create/update/delete: if false` (server Admin SDK)
  - [x] Index if needed: `(tutor_id, created_at)`
- [x] UI: tutor summary form (AC: #1)
  - [x] Form on tutor requests for eligible accepted trials (`TrialSummaryForm` + `useActionState` pattern)
  - [x] Show Join still available until/through completion as needed
- [x] UI: parent summary + Conversion CTA (AC: #2)
  - [x] On `/parent/bookings`: show summary/recommendation when present; show `$0` trial amount; show Conversion CTA when `canShowConversionCta`
  - [x] CTA routes to Epic 5 stub (e.g. `/parent/checkout?from_trial={id}`) with clear “paid booking coming soon” — do **not** invent Stripe checkout here
- [x] UI: minimal tutor earnings visibility (AC: #3)
  - [x] Small `/tutor/earnings` page listing ledger lines (or section on tutor home) — enough to prove stipend landed; full commission UX is Epic 5.5
- [x] Manual verification (AC: all)
  - [x] Accept → past slot → submit summary → parent sees text + CTA; ledger has one stipend; resubmit blocked / no double credit
  - [x] Parent CTA visible after `slot_end` even without summary
  - [x] `parent_amount_cents` stays 0 everywhere

## Dev Notes

### Brownfield reality (do not “fix” to architecture docs blindly)

- Runtime SoR for this app is **Firebase Auth + Firestore Admin SDK**, not Supabase/Postgres (architecture spine still says Postgres — follow **existing code patterns**).
- Currency standard is **USD** (global marketplace override).
- Trials already live in `trial_bookings` with `summary` / `recommendation` fields (always `null` today) and status `completed` (never written today).
- Stories 4.1 / 4.2 shipped book → accept/decline/timeout → `meeting_url` (Jitsi). Reuse those patterns; do not rewrite booking/accept flows.

### Product / policy ASSUMPTIONS (encode in domain constants)

| Item | Decision for this story |
| --- | --- |
| Stipend amount | `TRIAL_STIPEND_CENTS = 500` ($5.00 USD). Optional override via `process.env.TRIAL_STIPEND_CENTS` if easy; document in `.env.example`. Exact ops amount was deferred in PRD — this unblocks FR12. |
| When tutor may submit | Status `accepted` **and** `now >= slot_end` (scheduled end). Do not allow summary while trial is still in the future. |
| When parent sees Conversion CTA | `status === "completed"` **OR** (`status === "accepted"` && `now >= slot_end`) |
| Conversion destination | Stub page under parent shell linking intent to Epic 5; no Stripe, no recurring booking create |
| Double submit | Reject if already `completed`; stipend keyed uniquely by `trial_booking_id` + `entry_kind: "trial_stipend"` |

### Architecture compliance (adapted)

- **AD-2 / money:** Integer minor units + `currency: "USD"`. Parent never charged for trial. Stipend is platform liability line — not Stripe payment.
- **AD-3:** No UI that pays the tutor directly; stipend is platform ledger only.
- **AD-6:** All writes via Server Actions + Admin SDK.
- **AD-8:** Keep existing `meeting_url`; summary does not replace Join.
- **AD-10:** Domain types in `src/domain/*`; actions in `src/server/actions/*`; UI in `app/*` + `src/components/trials/*`.

### Existing code to extend (UPDATE — do not reinvent)

| Area | Path | Current behavior | This story changes |
| --- | --- | --- | --- |
| Trial domain | `src/domain/trials.ts` | Statuses, `$0` parent amount, meeting URL helper | Add stipend constant, completion/CTA helpers; optionally `completed_at` |
| Trial actions | `src/server/actions/trials.ts` | book / accept / decline / list / expire | Add `submitTrialSummary`; keep accept/decline intact |
| Parent bookings UI | `app/(parent)/parent/bookings/page.tsx` | Waiting / Join / rebook | Summary display + `$0` + Conversion CTA |
| Tutor requests UI | `app/(tutor)/tutor/requests/page.tsx` + `src/components/trials/tutor-trial-request-card.tsx` | Accept/Decline/Join | Summary form when eligible |
| Notifications | `src/server/actions/notifications.ts` | `createInAppNotification` | Notify parent on summary |
| Collections | `src/lib/firebase/db.ts` | No ledger | Add `ledger_entries` |
| Rules | `firestore.rules` | trial_bookings parent/tutor | Add ledger_entries read-only for clients |

### Ledger entry shape (suggested)

```ts
type LedgerEntry = {
  id: string;
  tutor_id: string;
  entry_kind: "trial_stipend"; // extend later for commission, payout, etc.
  amount_cents: number; // positive = credit to tutor
  currency: "USD";
  trial_booking_id: string;
  /** Idempotency key: `trial_stipend:{trial_booking_id}` */
  unique_key: string;
  note: string | null;
  created_at: string;
};
```

Idempotent credit: before write, query/get by `unique_key` (store `unique_key` as doc id **or** query + transaction). Prefer doc id = `unique_key` for simple Firestore get-or-create.

### Anti-patterns (do NOT)

- Do not implement Stripe Checkout / Connect / webhooks (Epic 5).
- Do not invent Postgres migrations or Supabase clients for this story.
- Do not charge parent or set `parent_amount_cents` ≠ 0.
- Do not allow client SDK writes to `ledger_entries`.
- Do not remove Join link prematurely or break accept/decline/timeout.
- Do not put salesy countdown / guilt copy on Conversion CTA (UX: calm, specific).

### UX notes

- Parent copy: calm confirmation of free trial ($0); Conversion CTA label like “Continue to paid lessons” / “Set up recurring booking” — not pushy timers.
- Tutor copy: short summary + recommendation fields; required textareas with clear errors via `useActionState`.
- Preserve Fraunces / design tokens already used on bookings/requests pages.

### Testing requirements

- Manual happy path + late-summary conversion path + double-submit stipend idempotency.
- No new E2E framework required unless already present; prefer focused unit tests for pure helpers (`canSubmitTrialSummary`, `canShowConversionCta`) if easy.
- Confirm Firestore rules: authenticated tutor cannot create ledger docs from client.

### Project Structure Notes

```text
src/domain/trials.ts                          # UPDATE
src/domain/ledger.ts                          # NEW
src/server/actions/trials.ts                  # UPDATE
src/server/actions/ledger.ts                  # NEW (list + credit helper)
src/lib/firebase/db.ts                        # UPDATE COLLECTIONS
firestore.rules                               # UPDATE
firestore.indexes.json                        # UPDATE if queried
src/components/trials/trial-summary-form.tsx  # NEW
src/components/trials/trial-conversion-cta.tsx # NEW (or inline)
src/components/trials/tutor-trial-request-card.tsx # UPDATE
app/(parent)/parent/bookings/page.tsx         # UPDATE
app/(parent)/parent/checkout/page.tsx         # NEW stub (Epic 5 placeholder)
app/(tutor)/tutor/earnings/page.tsx           # NEW minimal
app/(tutor)/tutor/page.tsx or layout nav      # UPDATE link to earnings
.env.example                                  # optional TRIAL_STIPEND_CENTS
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4 / Story 4.3]
- [Source: `_bmad-output/planning-artifacts/prds/.../prd.md` — FR-11, FR-12]
- [Source: `_bmad-output/planning-artifacts/architecture/.../ARCHITECTURE-SPINE.md` — AD-2, AD-3, money conventions, `ledger_entries`]
- [Source: `_bmad-output/planning-artifacts/implementation-readiness-report-2026-07-20.md` — CTA may stub until Epic 5]
- [Source: `_bmad-output/planning-artifacts/ux-designs/.../EXPERIENCE.md` — trial → summary → pay tone]
- [Source: `src/domain/trials.ts`, `src/server/actions/trials.ts` — shipped 4.1/4.2]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

- Gate unit tests: `npx tsx --test src/domain/trials-gates.test.ts` (9 pass)
- Pre-existing `next.config.ts` `serverActions` typing noise only on `tsc`

### Completion Notes List

- Added trial completion gates + `$5` stipend policy (`TRIAL_STIPEND_CENTS` env override).
- `submitTrialSummary` completes booking, notifies parent, credits idempotent `ledger_entries` doc id `trial_stipend_{bookingId}`.
- Parent bookings show summary + Conversion CTA; checkout stub at `/parent/checkout`.
- Tutor earnings page lists stipend lines; Firestore rules block client writes to ledger.

### File List

- `src/domain/trials.ts`
- `src/domain/ledger.ts`
- `src/domain/trials-gates.test.ts`
- `src/server/actions/trials.ts`
- `src/server/actions/ledger.ts`
- `src/lib/firebase/db.ts`
- `firestore.rules`
- `firestore.indexes.json`
- `src/components/trials/trial-summary-form.tsx`
- `src/components/trials/trial-conversion-cta.tsx`
- `src/components/trials/tutor-trial-request-card.tsx`
- `app/(parent)/parent/bookings/page.tsx`
- `app/(parent)/parent/checkout/page.tsx`
- `app/(tutor)/tutor/earnings/page.tsx`
- `app/(tutor)/tutor/page.tsx`
- `app/(tutor)/tutor/requests/page.tsx`
- `.env.example`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-07-27: Implemented trial summary, conversion CTA stub, and idempotent trial stipend ledger (Story 4.3).
