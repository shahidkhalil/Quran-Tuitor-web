---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-Quran-Tuitor-web-2026-07-19/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-Quran-Tuitor-web-2026-07-19/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Quran-Tuitor-web-2026-07-19/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Quran-Tuitor-web-2026-07-19/EXPERIENCE.md
---

# Quran-Tuitor-web - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Quran Tutor Marketplace (Quran-Tuitor-web), decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Parent and adult learners can register, verify email, and sign in.
FR2: Parent Account can create and manage Learner Profiles (minors require Parent Account link).
FR3: System enforces role-separated sessions (parent/adult, tutor applicant, verified tutor, admin).
FR4: Tutor applicants can submit application with identity, credentials, languages, child experience, intro video, payout prefs.
FR5: Applicants see application status pending | needs_info | approved | rejected with reasons when applicable.
FR6: Admin can approve, reject, or request more info; approved tutors can publish listings when complete.
FR7: Public Listing shows verification badge, quals, languages, gender, subjects, child experience, rates, availability, ratings, reviews, intro video.
FR8: Parents can filter/sort tutors by gender, languages, subjects/certs, children experience, price, timezone, rating.
FR9: Parents can shortlist tutors for comparison (persisted per Parent Account).
FR10: Parents can book a free Trial Lesson without card details; tutor accept/decline within timeout.
FR11: After trial, tutor submits summary + recommendation; parent can view and convert.
FR12: Trial is $0 to parent; tutor stipend credited per platform policy (platform-subsidized).
FR13: Parents can create Recurring Booking with payment; no double-booking of tutor slots.
FR14: Each lesson exposes meeting_url (Zoom/Meet) to parent and tutor only via booking views.
FR15: Attendance Record can be marked (completed, tutor no-show, student no-show, cancelled); parent sees confirmation.
FR16: Parents checkout via platform (card/wallet); invoices issued; no path to pay tutors directly.
FR17: Completed Paid Lessons post tutor earnings after Commission to ledger.
FR18: Tutors receive scheduled payouts to saved method; failures surfaced with support path.
FR19: Parent-Visible Thread for learner–tutor relationship; no private minor↔tutor DMs.
FR20: Tutors submit Progress Notes; parents view history and get notified.
FR21: Parents can rate/review after Completed Paid Lesson; aggregates on Listing; admin can hide abuse.
FR22: Parent or tutor can open Support Case from a booking.
FR23: Admin can offer free Rematch preserving package credits where applicable.
FR24: Admin can warn, suspend, or unlist tutors for policy breaches.
FR25: Admin console for applications, listings, bookings, cases, suspensions, commission config (audited).

### NonFunctional Requirements

NFR1: Encrypt data in transit; secure session handling; least privilege for Admin.
NFR2: Parent custody for minors; Parent-Visible Threads; GDPR and applicable children’s privacy frameworks; minimize child PII; DPIA before any recording feature.
NFR3: Booking/payment/messaging highly available; graceful path if video provider fails.
NFR4: Audit logs for vetting, payouts, case actions, suspensions, commission changes.
NFR5: Aim WCAG 2.1 AA on core parent flows (browse → trial → pay → messages).
NFR6: Browse/search p95 < 2s on typical home broadband.
NFR7: Support SLA targets: first response ≤4 business hours; resolution ≤5 business days (assumptions).
NFR8: No private minor↔tutor messaging; Platform Payments only; admin enforcement for no-shows and off-platform pay solicitation.
NFR9: Money stored as integer minor units + currency; UTC timestamps; UUID PKs (Architecture conventions).

### Additional Requirements

- **Starter (Epic 1 Story 1):** `create-next-app` (App Router, TS, Tailwind, ESLint) + Supabase project + Stripe account.
- Stack: Next.js 16.2.x, React 19, Supabase Auth/DB/Storage via `@supabase/ssr`, Stripe, Resend, Vercel; shadcn/ui.
- AD-1: Supabase Auth only identity plane (no Clerk).
- AD-2: Postgres owns domain; Stripe owns money movement; webhooks apply payment state.
- AD-3: Platform Payments only; payouts via platform rail (Stripe Connect Express assumed).
- AD-4: RLS on all user tables; service-role only in trusted server paths.
- AD-5: Parent custody + Parent-Visible messaging enforced in data model.
- AD-6: Domain writes only via Server Actions / Route Handlers + services.
- AD-7: Idempotent Stripe webhooks (`provider_event_id`).
- AD-8: Video is `meeting_url` only — no WebRTC.
- AD-9: `audit_log` for privileged admin ops.
- AD-10: Dependency direction app → actions → services → domain/db/providers.
- Environments: local / Vercel preview / prod with per-env Stripe webhooks.
- Email notifications for key events (trial, booking, payout, case updates).
- Modular monolith folder layout per Architecture Structural Seed.

### UX Design Requirements

UX-DR1: Implement DESIGN.md tokens (colors, typography Fraunces + Plus Jakarta Sans, spacing, radii) as CSS/Tailwind theme.
UX-DR2: Marketing Landing: brand-first hero (brand + one headline + one sentence + CTA group + full-bleed atmosphere) — no stats strip or tutor grid in hero.
UX-DR3: Public Browse/Search with filter bar (desktop) / Filter sheet (mobile) + active filter count + empty state.
UX-DR4: Listing detail with Verified badge, trust strip, Book free trial primary CTA, intro video support.
UX-DR5: Shortlist/compare surface for saved tutors.
UX-DR6: Teach with us entry + tutor application + status timeline (pending/needs_info/approved/rejected).
UX-DR7: Auth screens (register / sign-in / verify) aligned to DESIGN.md inputs/buttons.
UX-DR8: Parent app shell with role nav; mobile bottom nav (Home, Browse, Bookings, Messages, More).
UX-DR9: Parent surfaces: Dashboard, Learners CRUD, Messages (Parent-Visible Thread), Calendar/Bookings + Join, Progress history, Payments/invoices, Support cases, Account.
UX-DR10: Tutor shell: Listing editor, Requests, Calendar, Students, Earnings/payouts, Support; mobile bottom nav with Earnings.
UX-DR11: Admin shell (desktop-optimized): Vetting queue, Tutors, Bookings, Cases, Settings.
UX-DR12: Trust strip component on Listing + checkout (“Platform payments · Parent-visible chat · Free rematch”).
UX-DR13: Trial book flow with slot picker and **no card fields**; waiting/declined/timeout states.
UX-DR14: Checkout success state with receipt + next lesson + messages entry.
UX-DR15: Progress Note UI with structured fields (covered / improve / homework).
UX-DR16: Support Case form (category + booking + description) with SLA expectation copy.
UX-DR17: Loading skeletons for listing/calendar; inline error + retry; no blank pages.
UX-DR18: Accessibility: 44px touch targets, non-color-only status, focus rings, skip-to-content, `lang="ar" dir="rtl"` for Arabic previews, reduced-motion respect.
UX-DR19: Responsive breakpoints (<768 / 768–1024 / >1024); listing two-column on desktop.
UX-DR20: Microcopy voice per EXPERIENCE.md (calm, specific; never instruct off-platform pay).

### FR Coverage Map

FR1: Epic 1 — Parent/adult registration & sign-in
FR2: Epic 1 — Learner Profiles under Parent Account
FR3: Epic 1 — Role-separated sessions
FR4: Epic 2 — Tutor application
FR5: Epic 2 — Application status visibility
FR6: Epic 2 — Admin vetting actions
FR7: Epic 3 — Public Listing content
FR8: Epic 3 — Filter and sort
FR9: Epic 3 — Shortlist
FR10: Epic 4 — Book Trial Lesson
FR11: Epic 4 — Trial delivery artifacts
FR12: Epic 4 — Trial economics
FR13: Epic 5 — Create Recurring Booking
FR14: Epic 5 — Lesson join link
FR15: Epic 5 — Attendance Record
FR16: Epic 5 — Parent checkout
FR17: Epic 5 — Commission and tutor earnings
FR18: Epic 5 — Tutor payouts
FR19: Epic 6 — Parent-Visible Thread
FR20: Epic 6 — Progress Note
FR21: Epic 6 — Ratings and reviews
FR22: Epic 7 — Open Support Case
FR23: Epic 7 — Rematch
FR24: Epic 7 — Tutor quality enforcement
FR25: Epic 7 — Admin operations surface

## Epic List

### Epic 1: Platform Foundation & Family Accounts
Parents and adult learners can register, sign in, and manage Learner Profiles with role-separated sessions. Design system and app shells are established so later surfaces have a consistent home.
**FRs covered:** FR1, FR2, FR3

### Epic 2: Tutor Application & Vetting
Tutors can apply and track status; admins can approve, reject, or request more info so verified tutors can publish.
**FRs covered:** FR4, FR5, FR6

### Epic 3: Discover & Shortlist Tutors
Parents can browse public Verified Tutor listings, filter/sort, and shortlist for comparison.
**FRs covered:** FR7, FR8, FR9

### Epic 4: Free Trial Lessons
Parents can book a free trial (no card), tutors accept/decline within timeout, and trial summary + platform-subsidized stipend policy apply.
**FRs covered:** FR10, FR11, FR12

### Epic 5: Paid Bookings & Platform Money
Parents can create recurring paid bookings with platform checkout; lessons expose join links and attendance; tutors earn after commission and receive payouts.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18

### Epic 6: Messages, Progress & Reviews
Parents and tutors communicate via Parent-Visible Threads; tutors submit Progress Notes; parents rate/review after completed paid lessons.
**FRs covered:** FR19, FR20, FR21

### Epic 7: Support, Rematch & Admin Trust Ops
Parents/tutors can open Support Cases; admins can rematch, enforce quality (warn/suspend/unlist), and operate the audited admin console.
**FRs covered:** FR22, FR23, FR24, FR25

## Epic 1: Platform Foundation & Family Accounts

Parents and adult learners can register, sign in, and manage Learner Profiles with role-separated sessions. Design system and app shells are established so later surfaces have a consistent home.

### Story 1.1: Greenfield scaffold, design tokens & marketing landing

As a visitor,
I want a branded, deployable web app with the design system applied,
So that the marketplace has a trustworthy first impression and a foundation for features.

**Acceptance Criteria:**

**Given** a clean repo
**When** the starter is initialized (`create-next-app` App Router, TS, Tailwind, ESLint) with Supabase and Stripe project wiring documented
**Then** the app runs locally with modular-monolith folder layout per Architecture
**And** DESIGN.md tokens (ink-green, typography Fraunces + Plus Jakarta Sans, spacing, radii) are implemented as theme
**And** the Landing hero is brand-first (brand + one headline + one sentence + CTA group + full-bleed atmosphere) with no stats/tutor grid in the hero
**And** skip-to-content and basic focus styles exist (UX-DR18 start)

### Story 1.2: Parent and adult registration with email verification

As a parent or adult learner,
I want to register and verify my email,
So that I can create a secure account on the platform.

**Acceptance Criteria:**

**Given** I am on the register screen (UX-DR7)
**When** I submit valid email and password
**Then** a Parent/adult account is created via Supabase Auth (AD-1) and I am prompted to verify email
**And** after verification I can proceed to sign-in
**When** email is already registered or input is invalid
**Then** I see clear inline errors without inappropriate account leakage
**And** only tables/entities needed for auth identity + profile stub are created (no full schema dump)

### Story 1.3: Sign-in, role-separated sessions & app shells

As a signed-in user,
I want my session to reflect my role and show the right app shell,
So that parents, tutors, and admins only see appropriate navigation.

**Acceptance Criteria:**

**Given** a verified account
**When** I sign in
**Then** I receive a secure session and land in the correct shell (parent shell with mobile bottom nav placeholders: Home, Browse, Bookings, Messages, More)
**And** FR3 roles are enforced: parent/adult, tutor applicant, verified tutor, admin cannot access each other’s protected routes
**And** unauthenticated users hitting protected routes are redirected to sign-in
**And** I can sign out and the session ends
**And** domain writes go through server actions/services (AD-6), not client-only privilege escalation

### Story 1.4: Manage Learner Profiles under Parent Account

As a parent,
I want to create and manage Learner Profiles for my children (or myself as adult learner),
So that bookings and lessons are tied to the right learner.

**Acceptance Criteria:**

**Given** I am signed in as a Parent Account
**When** I create a Learner Profile (name, age band/DOB handling minimizing child PII per NFR2)
**Then** the profile is linked to my Parent Account and listed on Learners
**When** I edit or archive a Learner Profile I own
**Then** changes persist and only I (and authorized roles) can access it via RLS (AD-4/AD-5 start)
**And** minors require Parent Account link; adult self-learner path is supported
**And** empty state and form patterns match DESIGN.md / UX-DR9 Learners CRUD

## Epic 2: Tutor Application & Vetting

Tutors can apply and track status; admins can approve, reject, or request more info so verified tutors can publish.

### Story 2.1: Teach with us & tutor application submit

As a tutor applicant,
I want to submit my application with credentials and intro media,
So that I can be considered for the marketplace.

**Acceptance Criteria:**

**Given** I open Teach with us / apply (UX-DR6)
**When** I complete required fields (identity, credentials, languages, child experience, intro video, payout prefs) and submit
**Then** application is stored with status `pending` and appears in the Admin queue
**When** required fields are incomplete
**Then** submit is blocked with field-level errors
**And** only application-related tables/storage are added in this story

### Story 2.2: Application status visibility for applicants

As a tutor applicant,
I want to see my application status and any admin requests/reasons,
So that I am not left in a black hole.

**Acceptance Criteria:**

**Given** I have submitted an application
**When** I view application status
**Then** I see `pending` | `needs_info` | `approved` | `rejected` with a clear timeline (UX-DR6)
**And** when status is `needs_info` or `rejected`, I see admin reason/request text (silent rejection not allowed)
**And** status changes trigger email and/or in-app notification
**And** I can respond/upload when `needs_info`

### Story 2.3: Admin vetting queue & decisions

As an admin,
I want to review applications and approve, reject, or request more info,
So that only suitable tutors become Verified Tutors.

**Acceptance Criteria:**

**Given** I am signed in as Admin with the admin shell vetting queue (UX-DR11)
**When** I open a pending application
**Then** I can review docs, video, credentials, and fit signals
**When** I approve, reject, or request more info
**Then** applicant status updates accordingly and an `audit_log` entry records actor, action, timestamp (AD-9, NFR4)
**And** only Admin role can perform these actions
**And** rejected includes a required reason

### Story 2.4: Listing editor for approved tutors

As a verified tutor,
I want to complete and publish my listing (rates, availability, subjects),
So that parents can discover me after approval.

**Acceptance Criteria:**

**Given** my application is `approved`
**When** I complete required listing fields (rates within USD guardrails, timezone-aware availability, gender, subjects, etc.) and publish
**Then** my listing becomes eligible for public browse (Epic 3 consumes this)
**When** required listing fields are incomplete
**Then** I cannot publish and see what’s missing
**And** tutor shell includes Listing editor entry (UX-DR10)
**And** unpublished/incomplete tutors do not appear in public browse

## Epic 3: Discover & Shortlist Tutors

Parents can browse public Verified Tutor listings, filter/sort, and shortlist for comparison.

### Story 3.1: Public Listing detail

As a parent,
I want to view a Verified Tutor’s full listing,
So that I can judge fit before shortlisting or booking a trial.

**Acceptance Criteria:**

**Given** a published Verified Tutor listing
**When** I open the Listing detail (UX-DR4)
**Then** I see verification badge, quals, languages, gender, subjects, child experience, rates, availability summary, ratings, reviews, intro video when provided
**And** trust strip is visible (“Platform payments · Parent-visible chat · Free rematch”)
**And** primary CTA is Book free trial
**And** non-verified / unpublished tutors are not reachable via public listing URLs (404 or equivalent)
**And** listing uses two-column layout on desktop (UX-DR19)

### Story 3.2: Browse, filter & sort tutors

As a parent,
I want to filter and sort Verified Tutors,
So that I can find tutors who match my child’s needs quickly.

**Acceptance Criteria:**

**Given** I am on Browse/Search (UX-DR3)
**When** I apply filters (gender, languages, subjects/certs, children experience, price, timezone/availability overlap, min rating) and/or sort
**Then** results include only matching published Verified Tutors
**And** desktop shows filter bar; mobile uses Filter sheet with active filter count
**When** no tutors match
**Then** I see a clear empty state (not an error)
**And** loading uses listing skeletons (UX-DR17)
**And** browse aims for p95 < 2s on typical home broadband (NFR6)

### Story 3.3: Shortlist tutors for comparison

As a parent,
I want to shortlist tutors and compare them,
So that I can choose who to trial with confidence.

**Acceptance Criteria:**

**Given** I am signed in as a Parent Account
**When** I add/remove tutors from shortlist from browse or listing
**Then** shortlist persists across logout/login for my account (FR9)
**And** Shortlist/compare surface shows saved tutors (UX-DR5)
**When** I am not signed in and try to shortlist
**Then** I am prompted to sign in / register without losing intent where practical

## Epic 4: Free Trial Lessons

Parents can book a free trial (no card), tutors accept/decline within timeout, and trial summary + platform-subsidized stipend policy apply.

### Story 4.1: Book free Trial Lesson (no card)

As a parent,
I want to book a free trial for a Learner Profile without entering card details,
So that I can evaluate tutor fit with low friction.

**Acceptance Criteria:**

**Given** I am signed in with at least one Learner Profile and a published Verified Tutor
**When** I pick an available slot and book a Trial Lesson (UX-DR13 slot picker)
**Then** the booking is created with $0 charge intent and **no card fields** are shown or required
**And** the selected slot must be within tutor availability
**And** tutor receives a trial request notification
**And** parent sees waiting state until accept/decline/timeout

### Story 4.2: Tutor accept/decline trial & join link

As a tutor,
I want to accept or decline trial requests within a timeout,
So that parents get a clear outcome and can book elsewhere if needed.

**Acceptance Criteria:**

**Given** a pending trial request
**When** I accept within the timeout (`[ASSUMPTION: 24h]`)
**Then** status becomes accepted, a `meeting_url` is set (AD-8), and parent/tutor can see Join on the booking
**When** I decline or the timeout expires
**Then** the request closes, the slot is freed, and the parent can book another tutor/slot
**And** tutor Requests surface lists pending trials (UX-DR10)

### Story 4.3: Trial summary, conversion CTA & stipend ledger

As a tutor and parent,
I want a post-trial summary and correct trial economics,
So that the parent can convert and the tutor is credited per policy.

**Acceptance Criteria:**

**Given** an accepted trial has reached scheduled end (or completed)
**When** the tutor submits summary + recommendation
**Then** the parent can view it on the booking and sees a Conversion CTA to Recurring Booking
**And** if summary is late, parent can still convert after scheduled end (FR11 assumption)
**When** trial economics are applied (FR12)
**Then** parent-facing invoice/amount for the trial is $0
**And** tutor ledger shows a trial stipend line when policy amount > 0 (platform-subsidized; no parent charge)

## Epic 5: Paid Bookings & Platform Money

Parents can create recurring paid bookings with platform checkout; lessons expose join links and attendance; tutors earn after commission and receive payouts.

### Story 5.1: Parent checkout via Platform Payments

As a parent,
I want to pay only through the platform and receive a receipt,
So that money never goes directly to the tutor.

**Acceptance Criteria:**

**Given** I am converting to paid learning (package or recurring billing setup)
**When** I complete Stripe Checkout (card/wallet)
**Then** payment succeeds and I see success with receipt + next-lesson entry (UX-DR14)
**And** trust strip appears on checkout; no UI path instructs paying the tutor directly
**And** Stripe webhooks update payment state idempotently via `provider_event_id` (AD-7)
**And** amounts use integer minor units + currency (NFR9); Postgres owns domain, Stripe owns money movement (AD-2/AD-3)

### Story 5.2: Create Recurring Booking after payment

As a parent,
I want to create a recurring schedule with a Verified Tutor after payment setup,
So that weekly lessons are locked in for my Learner Profile.

**Acceptance Criteria:**

**Given** successful payment setup for the relationship
**When** I create a Recurring Booking (weekday/time, frequency) within tutor availability
**Then** parent and tutor both see upcoming sessions on their calendars
**When** the slot conflicts with an existing tutor booking
**Then** double-booking is rejected with a clear error
**And** calendar loading uses skeletons where applicable (UX-DR17)

### Story 5.3: Lesson join links

As a parent or tutor,
I want a third-party meeting link for each session,
So that we can join lessons without native video in the app.

**Acceptance Criteria:**

**Given** a scheduled lesson on a Recurring Booking (or paid session)
**When** I open the booking/calendar detail
**Then** I see `meeting_url` (Zoom/Meet) for that session (AD-8)
**And** the link is visible only to the Parent Account and Verified Tutor for that booking
**And** minors do not get a separate private channel for the link outside parent calendar / Parent-Visible surfaces
**When** the video provider link is missing/broken
**Then** there is a clear path to reschedule/support (NFR3 graceful degradation)

### Story 5.4: Attendance Record

As a tutor (with parent visibility),
I want to mark lesson attendance outcomes,
So that completion and no-shows are recorded for earnings and support.

**Acceptance Criteria:**

**Given** a scheduled lesson window
**When** attendance is marked as completed, tutor no-show, student no-show, or cancelled
**Then** the Attendance Record is stored and the parent sees confirmation
**And** tutor no-show surfaces/suggests a Support Case path for rematch/reschedule
**And** Completed Paid Lesson is required before earnings credit for that session (enables 5.5)

### Story 5.5: Commission and tutor earnings ledger

As a tutor,
I want completed paid lessons to post net earnings after commission,
So that I can see what I’ve earned without chasing parents.

**Acceptance Criteria:**

**Given** a Completed Paid Lesson
**When** earnings are calculated
**Then** tutor ledger receives an immutable line for net earnings after Commission
**And** parent-facing price and tutor net are visible only to the appropriate party
**And** Admin adjustment of ledger lines requires audit (NFR4)
**And** tutor Earnings surface shows ledger entries (UX-DR10)

### Story 5.6: Tutor payouts

As a tutor,
I want scheduled payouts to my saved payout method,
So that I get paid reliably through the platform.

**Acceptance Criteria:**

**Given** cleared earnings on my ledger and a saved payout method (Stripe Connect Express assumed)
**When** a scheduled payout runs (or I request payout per policy; `[ASSUMPTION: weekly cadence]`)
**Then** only cleared earnings are included and payout status is visible
**When** payout fails
**Then** I see failure status and a Support Case option
**And** privileged payout/ops actions are auditable where Admin intervenes

## Epic 6: Messages, Progress & Reviews

Parents and tutors communicate via Parent-Visible Threads; tutors submit Progress Notes; parents rate/review after completed paid lessons.

### Story 6.1: Parent-Visible Thread

As a parent,
I want all tutor–family messages for my learner visible to me,
So that minors never have private DMs with tutors.

**Acceptance Criteria:**

**Given** a Learner–Tutor relationship (trial or paid)
**When** parent or tutor sends a message in the thread
**Then** the Parent Account can read all messages; tutor cannot message a minor without parent visibility (FR19, AD-5)
**And** there is no product feature for private minor↔tutor DMs (NFR8)
**And** Messages appears in parent/tutor shells (UX-DR9/10)
**And** thread history is available to Admin when a Support Case is opened (read path ready for Epic 7)
**And** microcopy never instructs off-platform payment (UX-DR20)

### Story 6.2: Progress Notes after lessons

As a tutor,
I want to submit structured Progress Notes after lessons,
So that parents see what was covered and what to practice.

**Acceptance Criteria:**

**Given** a completed (or eligible) lesson for a Learner Profile
**When** I submit a Progress Note with covered / improve / homework (UX-DR15)
**Then** the parent can view it in Progress history for that learner
**And** the parent receives a notification on submit
**And** notes are immutable to the tutor after submit (Admin correction only)
**And** empty/loading states are clear (no blank page)

### Story 6.3: Ratings and reviews on Listings

As a parent,
I want to rate and review a tutor after a Completed Paid Lesson,
So that other families can trust the Listing aggregates.

**Acceptance Criteria:**

**Given** at least one Completed Paid Lesson with a Verified Tutor (`[ASSUMPTION: paid only]`)
**When** I submit a rating/review
**Then** it publishes (subject to moderation rules) and Listing aggregate rating updates
**When** Admin hides an abusive review
**Then** it is removed from public Listing and the action is audited
**And** reviews are not required to complete the paid lesson itself

## Epic 7: Support, Rematch & Admin Trust Ops

Parents/tutors can open Support Cases; admins can rematch, enforce quality (warn/suspend/unlist), and operate the audited admin console.

### Story 7.1: Open Support Case from a booking

As a parent or tutor,
I want to open a Support Case from a booking,
So that I get help in-platform without chasing anyone off-platform.

**Acceptance Criteria:**

**Given** I have a booking (trial or paid)
**When** I open a Support Case with category, booking, and description (UX-DR16)
**Then** the case stores booking ID, parties, category, description, timestamp
**And** SLA expectation copy is shown (NFR7 targets)
**And** I am not required to contact the other party off-platform to get help
**And** case appears in my Support list (parent/tutor shells)

### Story 7.2: Admin case queue & resolution

As an admin,
I want to work Support Cases with booking and thread context,
So that I can resolve disputes inside SLA.

**Acceptance Criteria:**

**Given** I am Admin on the Cases surface (UX-DR11)
**When** I open a case
**Then** I see parties, booking, attendance, and Parent-Visible Thread history
**When** I update status / add internal notes / resolve
**Then** the reporter can see outcome updates and actions are audited (AD-9)
**And** only Admin can perform privileged case actions

### Story 7.3: Free Rematch

As an admin,
I want to offer a free Rematch to another Verified Tutor,
So that families stay when fit or ops fails without an extra rematch fee.

**Acceptance Criteria:**

**Given** an open Support Case (or eligible rematch request)
**When** I execute free Rematch to another Verified Tutor
**Then** no extra rematch fee is charged
**And** unused prepaid lesson credits transfer where applicable (FR23 assumption)
**And** the case records the rematch decision
**And** the new relationship can continue bookings under platform rules

### Story 7.4: Tutor quality enforcement

As an admin,
I want to warn, suspend, or unlist tutors for policy breaches,
So that parents are protected from no-shows and off-platform payment solicitation.

**Acceptance Criteria:**

**Given** a Verified Tutor with evidence of breach (e.g. repeated no-shows, off-platform pay ask)
**When** I warn, suspend, or unlist them
**Then** the action is audited with actor, reason, timestamp
**And** a suspended/unlisted tutor cannot accept new bookings
**And** existing parents see appropriate status messaging without exposing internal notes

### Story 7.5: Admin operations console (bookings, listings, commission)

As an admin,
I want a complete ops console for applications, listings, bookings, cases, suspensions, and commission config,
So that I can run the managed marketplace day to day.

**Acceptance Criteria:**

**Given** Admin role
**When** I use Admin surfaces for applications (existing), Listings, bookings overview, Support Cases, suspensions, and Commission configuration (FR25)
**Then** all privileged actions require Admin role
**And** Commission config changes are audited
**And** admin shell remains desktop-optimized (UX-DR11)
**And** non-admins cannot access these routes
