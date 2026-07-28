---
title: PRD — Quran Tutor Marketplace
status: final
created: 2026-07-19
updated: 2026-07-19
---

# PRD: Quran Tutor Marketplace

## 0. Document Purpose

This finalized PRD defines product requirements for **Quran Tutor Marketplace** for PM, UX, architecture, and engineering. It builds on the finalized product brief and market research; it does not duplicate full research. Glossary terms are authoritative across FRs and journeys. Tech stack choices belong in architecture / `addendum.md`, not here.

**Inputs:** `_bmad-output/planning-artifacts/briefs/brief-Quran-Tuitor-web-2026-07-19/` · `_bmad-output/planning-artifacts/research/market-managed-online-quran-tutoring-marketplace-research-2026-07-19.md`

**Surface:** Responsive web app (desktop + mobile browsers). `[ASSUMPTION: no native iOS/Android apps in MVP]`

## 1. Vision

Quran Tutor Marketplace is a **global managed marketplace** that connects parents and students with **Verified Tutors** for live 1:1 Quran learning. Families **browse, compare, and choose** tutors; the platform owns verification, scheduling, **Platform Payments**, parent-safe messaging, support, rematch, and disputes. Standard listing and checkout currency is **USD**.

It exists because freelancers offer choice without trust, and academies often offer assignment without choice. Success means a parent like Sarah can book Adam’s Qaida lessons with confidence, a tutor like Yusuf can earn fairly without chasing WhatsApp payments, and ops like Amina can protect quality when something goes wrong.

Longer term, the same model expands across the English-speaking Muslim diaspora (USA, Canada, Australia, UAE) as the default trusted way to learn Quran online with verified teachers.

## 2. Target User

### 2.1 Jobs To Be Done

**Parent (Sarah)**
- Functional: Get consistent, correct Qaida/Tajweed learning for my child from home on a schedule that fits school life.
- Emotional: Feel my child is safe with a vetted adult online; feel I’m not gambling on a stranger from Facebook.
- Social: Be able to recommend a trustworthy option to other parents.

**Learner (Adam — via parent)**
- Functional: Learn with a patient tutor who explains clearly and keeps me engaged.
- Emotional: Feel comfortable and not afraid of the teacher.

**Tutor (Yusuf)**
- Functional: Get diaspora students, set my rate/availability, get paid reliably.
- Emotional: Be treated as a professional, not an unpaid lead magnet.
- Social: Build a reputation via reviews without building my own payment/ops stack.

**Admin (Amina)**
- Functional: Approve only suitable tutors; resolve parent issues inside SLA; stop off-platform pay and chronic no-shows.

### 2.2 Non-Users (v1)

- Schools/mosques needing multi-seat LMS procurement (B2B) — later.
- Students seeking only pre-recorded self-paced courses with no live tutor.
- Tutors unwilling to complete verification or accept Platform Payments.
- Parents requiring session recording as a hard prerequisite (deferred Phase 2).

### 2.3 Key User Journeys

**UJ-1. Sarah books a verified Qaida tutor for Adam and stays after a no-show is fixed.**

- **Persona + context:** Sarah, diaspora mother of Adam (8). Adam finished the Arabic alphabet and is ready for Qaida with proper Tajweed. She needs 1:1 lessons from home around a busy schedule.
- **Entry state:** Not yet a customer. Discovers the platform via Google (“online Quran tutor for kids”) and a Facebook parent recommendation. Lands on the marketing/site experience.
- **Path:**
  1. Sees verified tutors with rich profiles — ratings, reviews, experience, languages, qualifications, pricing, availability, intro videos.
  2. Filters: male tutor · English + Urdu · children experience · strong ratings · affordable monthly pricing · her timezone · Tajweed certified.
  3. Shortlists three tutors; books a **free trial** with one.
  4. Observes the trial with Adam — patience, clarity, engagement, child comfort — then receives a **lesson summary and recommendation**.
  5. Books **recurring weekly** lessons; pays **only through the platform** (card/wallet) — never sends money to the tutor. Expects invoices and support if payment issues arise.
  6. After first paid lesson expects: on-time start, professional session, attendance confirmation, short progress note (learned / improve / homework), easy access to future bookings and support.
- **Climax:** Trial feels right for Adam; Sarah converts to paid recurring booking with confidence that payment and trust sit with the platform.
- **Resolution:** Active weekly learner relationship; Sarah can manage bookings and see progress; she becomes a recommender when ops handle failure well.
- **Edge case:** Tutor misses a lesson without notice. Sarah reports **via the platform** (not private tutor chase). Support responds promptly, apologizes, reschedules, and offers **free rematch** to another verified tutor. She stays and recommends the service.

*Stakeholder-narrated and accepted (proceed signal: “make it”).*

**UJ-2. Yusuf gets approved, teaches his first student abroad, and gets paid fairly.** `[ASSUMPTION: persona details — edit freely]`

- **Persona + context:** Yusuf, Hafiz and Tajweed-certified tutor in Pakistan, fluent in English and Urdu, 5+ years teaching children. Tired of WhatsApp freelancing (chasing payments, no backup brand) and opaque academy cuts. Wants diaspora students and reliable payouts.
- **Entry state:** Visits “Teach with us,” starts tutor application.
- **Path:**
  1. Submits profile: ID, credentials (Ijazah/Tajweed certs), experience with children, languages, intro video, payout method details.
  2. Sees clear **pending / needs info / approved / rejected** status — not a black hole. `[ASSUMPTION: status model]`
  3. On approval, completes listing: hourly/monthly rates within platform guardrails (USD), weekly availability with clear timezone, gender (male), subjects (Qaida, Tajweed).
  4. Receives a **trial booking** request (e.g. Sarah/Adam). Accepts; teaches trial; writes short summary + recommendation.
  5. Student converts to recurring; Yusuf teaches first paid lesson on time; marks attendance; submits progress note.
  6. Sees earnings in dashboard; payout available on platform schedule (weekly) — never asks parent for personal transfer.
- **Climax:** First paid lesson completed and earnings visible/payable through the platform without chasing Sarah.
- **Resolution:** Active tutor with recurring student(s); can update availability and rates; trusts rematch/support won’t strand him unpaid for completed work. `[ASSUMPTION: tutors paid for completed paid lessons; trials platform-subsidized stipend — see Monetization]`
- **Edge case:** Application **rejected** (e.g. weak English demo or unverifiable credential). Yusuf sees reason + what to fix or that he cannot reapply yet — no silent ghosting. Alternate edge: payout delayed — he opens a support case in-platform and gets a clear ETA.

**UJ-3. Amina (admin) vets a tutor and handles Sarah’s no-show case.** `[ASSUMPTION: admin persona]`

- **Persona + context:** Amina, platform operations/admin spanning major diaspora timezones, responsible for tutor quality and parent trust.
- **Entry state:** Authenticated admin console.
- **Path:**
  1. Reviews Yusuf’s application queue: docs, video, credentials, English/child-teaching fit.
  2. Approves Yusuf → listing goes live; or requests more info / rejects with reason.
  3. Later: Sarah reports a no-show. Amina sees booking, attendance, message thread (parent-visible), and tutor history.
  4. Reschedules or processes **free rematch**, notes the case, may warn/suspend tutor for repeated no-shows. `[ASSUMPTION: strike policy]`
- **Climax:** Parent issue resolved inside SLA without off-platform chaos; supply quality protected.
- **Resolution:** Case closed; metrics updated (dispute time, rematch offered).
- **Edge case:** Suspected off-platform payment request — Amina investigates, warns/suspends, protects Sarah.

## 3. Glossary

- **Parent Account** — Adult account that owns one or more **Learner Profiles**; primary payer and message participant for minors.
- **Learner Profile** — Child or adult learner associated with a Parent Account (or self for adult learners). For minors, Parent Account is required.
- **Verified Tutor** — Tutor approved by Admin after vetting; eligible to appear in browse/search and accept bookings.
- **Listing** — Public Verified Tutor profile: credentials, languages, gender, subjects, rates, availability, ratings, reviews, intro media.
- **Trial Lesson** — Free-to-parent introductory lesson used to evaluate fit; `[ASSUMPTION: platform-subsidized tutor stipend, not unpaid like Preply 100% take]`.
- **Paid Lesson** — Billable lesson after conversion; funds flow via **Platform Payments**.
- **Recurring Booking** — Standing weekly (or multi-slot) schedule between a Learner Profile and a Verified Tutor.
- **Platform Payments** — All student/parent payments and tutor payouts processed by the platform; direct student↔tutor transfers are prohibited.
- **Parent-Visible Thread** — Messaging channel for a booking/relationship where the Parent Account can read all messages; minors cannot have private tutor DMs.
- **Progress Note** — Short post-lesson report: what was covered, improvement areas, homework/revision.
- **Rematch** — Reassignment of Learner Profile to a different Verified Tutor without extra rematch fee when fit/ops failure warrants it.
- **Support Case** — Parent- or tutor-opened issue handled by Admin/support (no-show, payment, dispute, rematch).
- **Commission** — Platform share of Paid Lesson revenue. `[ASSUMPTION: published take rate in 20–30% band; sliding optional later]`
- **Attendance Record** — Marked outcome of a scheduled lesson (completed, tutor no-show, student no-show, cancelled).

## 4. Features

### 4.1 Accounts and roles

**Description:** Registration and auth for Parent Accounts, adult learners, tutors, and Admin. Minors use Learner Profiles under a Parent Account. Realizes UJ-1, UJ-2, UJ-3.

**Functional Requirements:**

#### FR-1: Parent and adult registration

Parent Account or adult learner can register with email (and password or magic link `[ASSUMPTION]`), verify email, and sign in.

**Consequences (testable):**
- Unverified email cannot complete payment for Recurring Booking.
- Duplicate email cannot create a second account.

#### FR-2: Learner Profiles under Parent Account

Parent Account can create/edit Learner Profiles (name, age/DOB band, level goals, gender preference notes).

**Consequences (testable):**
- Learner Profile under 18 `[ASSUMPTION: under 18 = minor]` cannot exist without a Parent Account link.
- Bookings and Parent-Visible Threads attach to a specific Learner Profile.

#### FR-3: Role-separated sessions

System enforces distinct capabilities for parent/adult, Verified Tutor, applicant tutor, and Admin.

**Consequences (testable):**
- Tutor cannot access Admin vetting queue.
- Parent cannot mark another family’s Attendance Record.

### 4.2 Tutor onboarding and vetting

**Description:** Tutors apply with credentials and media; Admin approves, requests info, or rejects with reason; approved tutors become Verified Tutors with Listings. Realizes UJ-2, UJ-3.

**Functional Requirements:**

#### FR-4: Tutor application

Applicant can submit identity details, credential documents, languages, child-teaching experience, intro video, and payout preferences.

**Consequences (testable):**
- Incomplete required fields cannot be submitted.
- Submitted application appears in Admin queue with status `pending`.

#### FR-5: Application status visibility

Applicant can see status: `pending` | `needs_info` | `approved` | `rejected`, plus Admin reason/request text when applicable.

**Consequences (testable):**
- Status changes notify applicant (email and/or in-app).
- Rejected applicants see reason; silent rejection is not allowed.

#### FR-6: Admin vetting actions

Admin can approve, reject, or request more info on an application; on approve, Listing can be published when required Listing fields are complete.

**Consequences (testable):**
- Only `approved` tutors appear in public browse.
- Audit log records actor, action, timestamp for each vetting decision.

### 4.3 Tutor Listing, browse, and compare

**Description:** Parents discover Verified Tutors via search/filter and rich Listings (credentials, ratings, pricing, availability, intro video). Realizes UJ-1.

**Functional Requirements:**

#### FR-7: Public Listing content

Listing shows verification badge, qualifications, languages, gender, subjects, child experience signal, rates, availability summary, ratings aggregate, reviews, intro video when provided.

**Consequences (testable):**
- Missing required Listing fields blocks publish.
- Non-verified tutors never appear in public results.

#### FR-8: Filter and sort

Parent can filter by gender, languages, subjects/certifications (e.g. Tajweed), children experience, price band, availability/timezone overlap, minimum rating.

**Consequences (testable):**
- Filter combination returns only matching Verified Tutors.
- Empty results show clear empty state (not an error).

#### FR-9: Shortlist

Parent can shortlist tutors for comparison before booking a Trial Lesson. `[ASSUMPTION: shortlist persisted per Parent Account]`

**Consequences (testable):**
- Shortlist survives logout/login for that Parent Account.

### 4.4 Trial Lesson and conversion

**Description:** Free-to-parent Trial Lesson with observe-friendly flow, then summary; convert to Recurring Booking. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-10: Book Trial Lesson

Parent can book a Trial Lesson with a Verified Tutor for a Learner Profile without entering card details. `[ASSUMPTION: no card required to start trial]`

**Consequences (testable):**
- Trial requires selected slot within tutor availability.
- Tutor receives request and can accept/decline within a timeout `[ASSUMPTION: 24h]`; decline/timeout frees the parent to book another.

#### FR-11: Trial delivery artifacts

After Trial Lesson, tutor submits lesson summary + recommendation; parent can view it on the booking.

**Consequences (testable):**
- Conversion CTA to Recurring Booking is available after summary is submitted (or after scheduled end if summary late — `[ASSUMPTION: parent can still convert]`).

#### FR-12: Trial economics

System records Trial Lesson as non-charged to parent; tutor stipend credited per platform policy. `[ASSUMPTION: fixed stipend funded by platform]`

**Consequences (testable):**
- Parent invoice for trial amount is $0.
- Tutor ledger shows trial stipend line item when policy amount > 0.

### 4.5 Scheduling, Recurring Booking, and attendance

**Description:** Recurring weekly lessons, calendar, Attendance Records, on-time expectations. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-13: Create Recurring Booking

Parent can create Recurring Booking (weekday/time, frequency) with a Verified Tutor after successful payment setup.

**Consequences (testable):**
- Conflicting tutor slot cannot be double-booked.
- Parent and tutor both see upcoming sessions on their calendars.

#### FR-14: Lesson join link

For each session, system provides the scheduled video meeting link (third-party). `[ASSUMPTION: Zoom or Google Meet links; not native WebRTC in MVP]`

**Consequences (testable):**
- Link visible to Parent Account and Verified Tutor for that booking only.
- Minor does not receive a separate private channel for the link outside Parent-Visible Thread / parent calendar.

#### FR-15: Attendance Record

Tutor and/or system marks Attendance Record: completed, tutor no-show, student no-show, cancelled. Parent sees confirmation.

**Consequences (testable):**
- Tutor no-show can open/auto-suggest a Support Case path for rematch/reschedule.
- Completed Paid Lesson is a prerequisite for tutor earnings credit for that session.

### 4.6 Platform Payments and payouts

**Description:** Parents pay only via platform; tutors paid via payout rails; invoices and ledgers. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-16: Parent checkout

Parent can pay for lesson packages or recurring billing using card or supported digital wallet. `[ASSUMPTION: Stripe or equivalent; USD as standard currency]`

**Consequences (testable):**
- No UI path instructs paying the tutor directly.
- Successful payment generates a parent-visible invoice/receipt.

#### FR-17: Commission and tutor earnings

For each Completed Paid Lesson, system calculates tutor earnings after Commission and posts to tutor ledger.

**Consequences (testable):**
- Ledger lines are immutable except via Admin adjustment with audit.
- Parent-facing price and tutor net are separately visible to each party as appropriate.

#### FR-18: Tutor payouts

Tutor can request or receive scheduled payouts to saved payout method. `[ASSUMPTION: weekly payout cadence]`

**Consequences (testable):**
- Payout only includes cleared earnings.
- Failed payout surfaces status + Support Case option.

### 4.7 Parent-Visible messaging

**Description:** All tutor–family communication for minor learners is parent-visible; no private child↔tutor DMs. Realizes UJ-1 trust path.

**Functional Requirements:**

#### FR-19: Parent-Visible Thread

System provides a Parent-Visible Thread per Learner–Tutor relationship; Parent Account can read all messages; tutor messages are visible to parent.

**Consequences (testable):**
- No product feature enables tutor to message a minor Learner Profile without Parent Account visibility.
- Thread history available to Admin when a Support Case is opened.

### 4.8 Progress Notes, ratings, and reviews

**Description:** Post-lesson Progress Notes; ratings/reviews after Paid Lessons. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-20: Progress Note

After a lesson, tutor can submit Progress Note (covered, improvements, homework). Parent can view history per Learner Profile.

**Consequences (testable):**
- Parent receives notification when Progress Note is submitted.
- Notes are immutable to tutor after submit except Admin correction.

#### FR-21: Ratings and reviews

Parent can rate/review a Verified Tutor after at least one Completed Paid Lesson (or completed Trial — `[ASSUMPTION: paid only]`).

**Consequences (testable):**
- Aggregate rating on Listing updates from published reviews.
- Admin can hide abusive reviews with audit.

### 4.9 Rematch, Support Cases, and disputes

**Description:** In-platform reporting, reschedule, free Rematch, dispute handling. Realizes UJ-1 edge, UJ-3.

**Functional Requirements:**

#### FR-22: Open Support Case

Parent or tutor can open a Support Case from a booking (no-show, quality, payment, other).

**Consequences (testable):**
- Case captures booking ID, parties, category, description, timestamp.
- Parent is not required to contact tutor off-platform to get help.

#### FR-23: Rematch

Admin (or automated policy `[ASSUMPTION: Admin-mediated in MVP]`) can offer free Rematch to another Verified Tutor without charging an extra rematch fee.

**Consequences (testable):**
- Rematch preserves unused prepaid lesson credits where applicable. `[ASSUMPTION: package credits transfer]`
- Case records rematch decision.

#### FR-24: Tutor quality enforcement

Admin can warn, suspend, or unlist a Verified Tutor for policy breaches (repeated no-shows, off-platform payment solicitation).

**Consequences (testable):**
- Suspended tutor cannot accept new bookings.
- Action is audited.

### 4.10 Admin console

**Description:** Ops tools for vetting, bookings oversight, cases, commission config. Realizes UJ-3.

**Functional Requirements:**

#### FR-25: Admin operations surface

Admin can manage applications, Listings, bookings overview, Support Cases, user suspensions, and Commission configuration.

**Consequences (testable):**
- All privileged actions require Admin role.
- Config changes to Commission are audited.

## 5. Non-Goals (Explicit)

- Not an employed-tutor academy that only assigns teachers with no browse/choice.
- Not a pure classifieds board with off-platform payment.
- Not a full Islamic studies LMS / CMS for mosques in MVP.
- Not an AI Tajweed coach product in MVP.
- Not a native mobile app store release in MVP.
- Not a session-recording surveillance product in MVP.

## 6. MVP Scope

### 6.1 In Scope

- FR-1 through FR-25 capabilities above (web responsive)
- Global launch: USD pricing, timezone-aware availability, English UI
- Third-party video links
- Email notifications for key events (trial, booking, payout, case updates)

### 6.2 Out of Scope for MVP

- Session recording (Phase 2+, consent-based) — `[NOTE FOR PM: emotionally load-bearing for some parents]`
- AI progress/Tajweed tools
- Group classes at scale
- Featured ads / paid ranking
- Certificates program
- Multi-country localization day one (USA/CA/AU/UAE after validation)
- Native iOS/Android apps
- Custom WebRTC video stack

## 7. Success Metrics

**Primary**
- **SM-1:** Paying Parent Accounts with ≥1 active Recurring Booking — `[ASSUMPTION: 250]` at 12 months. Validates FR-13, FR-16.
- **SM-2:** Active Verified Tutors (≥1 Completed Paid Lesson in 30 days) — `[ASSUMPTION: 50]` at 12 months. Validates FR-6, FR-15, FR-18.
- **SM-3:** Trial → Paid conversion — `[ASSUMPTION: ≥25%]`. Validates FR-10–FR-13.

**Secondary**
- **SM-4:** Week-8 retention of paying families — `[ASSUMPTION: ≥60%]`. Validates Progress Notes, reliability, Rematch.
- **SM-5:** Median Support Case first-response time — `[ASSUMPTION: ≤4 business hours]`; resolution `[ASSUMPTION: ≤5 business days]`. Validates FR-22–FR-23.
- **SM-6:** 100% of lesson charges via Platform Payments (policy breaches handled). Validates FR-16, FR-24.
- **SM-7:** Median payout availability ≤7 days after cleared earnings. Validates FR-18.

**Counter-metrics (do not optimize)**
- **SM-C1:** Do not maximize tutor count without vetting quality (blocks SM-3/SM-4).
- **SM-C2:** Do not maximize take rate if it drives tutor churn or off-platform leakage.
- **SM-C3:** Do not maximize trials booked if show-up rate collapses (ops quality).

## 8. Cross-Cutting NFRs

- **Security:** Encrypt data in transit; secure password/session handling; principle of least privilege for Admin.
- **Privacy / children:** Parent Account custody for minors; Parent-Visible Threads; GDPR and applicable children’s privacy frameworks; DPIA before any Phase-2 recording. Minimize child PII.
- **Reliability:** Booking/payment/messaging paths highly available; graceful degradation if video provider fails (reschedule path).
- **Observability:** Audit logs for vetting, payouts, case actions, suspensions.
- **Accessibility:** Aim WCAG 2.1 AA for core parent flows. `[ASSUMPTION]`
- **Performance:** Browse/search p95 < 2s on typical home broadband. `[ASSUMPTION]`
- **Support SLA:** Published parent/tutor response targets matching SM-5.

## 9. Monetization

- Revenue primarily from **Commission** on Paid Lessons / packages.
- `[ASSUMPTION: take rate 20–30% published; optional volume discount later]`
- Trials free to parents; `[ASSUMPTION: platform-funded tutor stipend]` to avoid Preply-style unpaid-trial toxicity.
- No featured-ad revenue in MVP.

## 10. Constraints and Guardrails

- **Safety:** No private minor↔tutor messaging; Platform Payments only; Admin enforcement for no-shows and off-platform pay.
- **Privacy:** Clear retention for messages, credentials, and payment metadata; parent rights of access/erasure pathways planned with legal.
- **Cost:** Prefer third-party video to avoid building WebRTC in MVP.

## 11. Open Questions

Deferred at finalize (not phase-blockers for UX/architecture start). Owner: PM. Revisit before payment/vetting implementation details freeze.

1. Exact Trial Lesson stipend amount and eligibility rules? — *Defer to monetization design; keep platform-subsidized stipend assumption.*
2. Package model: pay-per-lesson vs monthly package vs both at launch? — *Defer to UX checkout flows; architecture should support both.*
3. Background-check depth for tutors teaching minors internationally (MVP vs Phase 2)? — *Defer to legal/ops; MVP = credential + demo vetting minimum.*
4. Strike thresholds before auto-unlist for no-shows? — *Defer; MVP Admin-manual enforcement (FR-24).*
5. Adult learner messaging without Parent Account — same thread model? — *Defer to UX; default: adult owns their thread.*
6. Native apps out for 12+ months? — *Accepted: web-only MVP (§6.2).*

## 12. Assumptions Index

- No native mobile apps in MVP (§0, §6.2)
- Auth email + password or magic link (FR-1)
- Minor = under 18 (FR-2)
- Application statuses pending/needs_info/approved/rejected (FR-5)
- Shortlist persisted (FR-9)
- No card required for trial (FR-10)
- Tutor accept/decline timeout 24h (FR-10)
- Parent can convert even if summary late (FR-11)
- Platform-subsidized trial stipend (FR-12, §9)
- Zoom/Meet links not native video (FR-14)
- Stripe-class processor with USD (FR-16)
- Commission 20–30% (Glossary, §9)
- Weekly payouts (FR-18)
- Reviews after paid lessons only (FR-21)
- Admin-mediated rematch in MVP (FR-23)
- Package credits transfer on rematch (FR-23)
- Success metric numeric targets from brief (SM-1–SM-7)
- WCAG AA aim; browse p95 < 2s (§8)

