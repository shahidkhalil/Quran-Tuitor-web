---
baseline_commit: NO_VCS
---

# Story 5.1: Parent checkout via Platform Payments

Status: review

## Story

As a parent,
I want to pay only through the platform and receive a receipt,
so that money never goes directly to the tutor.

## Acceptance Criteria

1. **Given** I am converting from a completed/eligible free trial (`from_trial`)
   **When** I start Stripe Checkout for a lesson package
   **Then** I pay via Stripe (card/wallet) with amounts in integer USD cents
   **And** trust strip is visible; no UI tells me to pay the tutor directly

2. **Given** payment succeeds
   **When** Stripe sends `checkout.session.completed`
   **Then** webhook updates payment to `paid` idempotently using `provider_event_id`
   **And** parent sees success with receipt link + next step toward scheduling (Epic 5.2 stub OK)

3. **Given** checkout is cancelled or abandoned
   **When** I return to the app
   **Then** I can retry checkout without corrupted payment state

## Tasks / Subtasks

- [x] Domain + collections: `payments`, `provider_events`; package pricing helper
- [x] Stripe client + Checkout Session server action from trial conversion
- [x] Webhook route (raw body, signature verify, idempotent fulfill)
- [x] Checkout UI (trust strip, package summary, Pay with Stripe)
- [x] Success page (receipt + next-lesson / schedule CTA stub)
- [x] Env example + Firestore rules (client read own payments; writes server-only)

## Dev Notes

### Brownfield
- SoR is **Firestore + Firebase Auth**, not Postgres. Money still moves only via Stripe (AD-2/AD-3).
- Conversion entry: `/parent/checkout?from_trial={id}` from Story 4.3.
- Currency: **USD** minor units.

### Package ASSUMPTION (MVP)
- One-time Checkout for **4 lessons** at listing `rate_usd` → `amount_cents = rate_usd * 100 * 4`.
- Recurring Stripe Subscription deferred; Story 5.2 owns schedule after `paid`.

### Must follow
- Server Actions / Route Handlers only for Stripe secret.
- Webhook: `await request.text()` + `constructEvent`; persist event id before side effects.
- No tutor personal payment details anywhere.

### Structure
```text
src/domain/payments.ts
src/lib/stripe.ts
src/server/actions/payments.ts
src/server/services/payments.ts
app/api/stripe/webhook/route.ts
app/(parent)/parent/checkout/page.tsx
app/(parent)/parent/checkout/success/page.tsx
app/(parent)/parent/schedule/page.tsx
src/components/payments/start-checkout-button.tsx
```

### References
- epics.md Story 5.1 / FR-16
- ARCHITECTURE-SPINE AD-2, AD-3, AD-7
- TrustStrip UX-DR12

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Completion Notes List

- Stripe Checkout Session for 4-lesson package from trial conversion
- Webhook idempotent via `provider_events/{event.id}`
- Success page syncs session if webhook delayed; schedule stub for 5.2
- Epic 4 marked done in sprint-status

### File List

- `src/domain/payments.ts`
- `src/lib/stripe.ts`
- `src/lib/firebase/db.ts`
- `src/server/actions/payments.ts`
- `src/server/services/payments.ts`
- `src/components/payments/start-checkout-button.tsx`
- `app/api/stripe/webhook/route.ts`
- `app/(parent)/parent/checkout/page.tsx`
- `app/(parent)/parent/checkout/success/page.tsx`
- `app/(parent)/parent/schedule/page.tsx`
- `firestore.rules`
- `.env.example`
- `package.json` / `package-lock.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/5-1-parent-checkout-via-platform-payments.md`

## Change Log

- 2026-07-27: Implemented Stripe platform checkout from trial conversion (Story 5.1).
